import { create } from 'zustand';

import { useAuthStore } from '@/lib';
import { Env } from '@/lib/env';
import { type LiveLocation, type LiveLocationMap, mergeLiveLocation, parsePersonnelLocationUpdate, parseUnitLocationUpdate } from '@/lib/live-locations';
import { logger } from '@/lib/logging';
import { type SignalRConnectionStateCallbacks, signalRService } from '@/services/signalr.service';

import { useCoreStore } from '../app/core-store';
import { securityStore, useSecurityStore } from '../security/store';
import { useWeatherAlertsStore } from '../weatherAlerts/store';

let updateHubListenersRegistered = false;
let updateHubStateCallbackHandle: SignalRConnectionStateCallbacks | null = null;

/** Messages the geolocation hub pushes. `onGeolocationConnect` is the reply to `GeolocationConnect`. */
export const GEOLOCATION_HUB_METHODS = ['onUnitLocationUpdated', 'onPersonnelLocationUpdated', 'onGeolocationConnect'];
/** A push for a pin the map does not have waits this long so a burst of them costs one refetch. */
export const UNKNOWN_PIN_REFRESH_DELAY_MS = 4000;
/** Each unknown pin may cause at most one refetch per window (the viewer may simply not be allowed to see it). */
export const UNKNOWN_PIN_REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
/** Watchdog repair backoff after a failed repair attempt: doubles from the base up to the cap. */
export const HUB_REPAIR_BASE_BACKOFF_MS = 30 * 1000;
export const HUB_REPAIR_MAX_BACKOFF_MS = 10 * 60 * 1000;

let geolocationHubListenersRegistered = false;
let geolocationHubStateCallbackHandle: SignalRConnectionStateCallbacks | null = null;

// Whether the app currently wants each hub connected (set by connect*, cleared by disconnect*). The
// watchdog only repairs hubs that are wanted, so it never resurrects one that was deliberately closed.
let updateHubWanted = false;
let geolocationHubWanted = false;

// Group membership is per connection id: every new connection (initial, automatic reconnect, or the
// service's rebuild after close) must invoke the join method again. These track the CURRENT connection.
let updateHubJoined = false;
let geolocationHubJoined = false;

// Whether a join has ever succeeded in this session. Any later join is a RE-join after a gap, during
// which messages were missed, so it triggers a one-off catch-up refetch.
let updateHubHasJoined = false;
let geolocationHubHasJoined = false;

const unknownPinRefreshLog = new Map<string, number>();
let unknownPinRefreshTimer: ReturnType<typeof setTimeout> | null = null;
const hubRepairBackoff = new Map<string, { failures: number; nextAttemptAt: number }>();

const canAttemptHubRepair = (hubName: string, now: number): boolean => (hubRepairBackoff.get(hubName)?.nextAttemptAt ?? 0) <= now;

const recordHubRepairResult = (hubName: string, succeeded: boolean, now: number): void => {
  if (succeeded) {
    hubRepairBackoff.delete(hubName);
    return;
  }

  const failures = (hubRepairBackoff.get(hubName)?.failures ?? 0) + 1;
  const delay = Math.min(HUB_REPAIR_BASE_BACKOFF_MS * 2 ** (failures - 1), HUB_REPAIR_MAX_BACKOFF_MS);
  hubRepairBackoff.set(hubName, { failures, nextAttemptAt: now + delay });
};

interface SignalRState {
  isUpdateHubConnected: boolean;
  lastUpdateMessage: unknown;
  /** Bumped by every update-hub message. Only for consumers that genuinely care about all of them. */
  lastUpdateTimestamp: number;
  /**
   * Per-domain stamps. Widgets subscribe to the one domain they render, so a personnel status
   * change no longer refetches calls, units and everything else on the board.
   */
  lastCallsTimestamp: number;
  lastUnitsTimestamp: number;
  lastPersonnelTimestamp: number;
  /** True only once the server has confirmed the department-group join (`onGeolocationConnect`). */
  isGeolocationHubConnected: boolean;
  lastGeolocationMessage: unknown;
  lastGeolocationTimestamp: number;
  /**
   * Latest realtime position per unit/personnel, keyed by lower-cased REST pin id (`u12`,
   * `p<guid>`). A per-entity map rather than a single "last message" slot: SignalR dispatches a
   * frame's messages synchronously and React batches the resulting renders, so a single slot drops
   * all but the last position of a burst.
   */
  liveLocations: LiveLocationMap;
  /** Bumped to ask every live map for one background refetch of the REST pins. */
  mapRefreshRequestTimestamp: number;
  error: Error | null;
  connectUpdateHub: () => Promise<void>;
  disconnectUpdateHub: () => Promise<void>;
  reconnectUpdateHub: () => Promise<void>;
  connectGeolocationHub: () => Promise<void>;
  disconnectGeolocationHub: () => Promise<void>;
  checkConnectionState: () => boolean;
  /** Ask the live maps to refetch their pins once (e.g. after a re-join, when pushes were missed). */
  requestMapRefresh: () => void;
  /** Report live locations that matched no pin; coalesced and rate-limited into map refetches. */
  reportUnknownLivePins: (pinIds: string[]) => void;
  /** Drop all live positions and the bookkeeping around them (sign-out). */
  clearLiveLocations: () => void;
  /** Watchdog: repair any wanted hub whose connection was lost for good or that is not in its group. */
  ensureHubConnections: () => Promise<void>;
}

const markUpdateHubJoined = (): void => {
  const isRejoin = updateHubHasJoined;
  updateHubJoined = true;
  updateHubHasJoined = true;

  if (isRejoin) {
    // Whatever was broadcast while this client was out of the group is gone. Nudge every widget to
    // refetch once so a wall board does not sit on stale calls/units/personnel until the next event.
    const now = Date.now();
    useSignalRStore.setState({ lastUpdateTimestamp: now, lastCallsTimestamp: now, lastUnitsTimestamp: now, lastPersonnelTimestamp: now });
  }
};

const rejoinUpdateHub = async (): Promise<void> => {
  const departmentId = securityStore.getState().rights?.DepartmentId;
  if (!departmentId) {
    logger.warn({
      message: 'DepartmentId not available, cannot re-join update hub after reconnect',
    });
    return;
  }

  try {
    await signalRService.invoke(Env.CHANNEL_HUB_NAME, 'connect', parseInt(departmentId, 10));
    markUpdateHubJoined();
    logger.info({ message: 'Re-joined update hub department group after reconnect' });
  } catch (error) {
    // The watchdog retries the join while the connection is up but not in its group.
    logger.error({
      message: 'Failed to re-join update hub department group after reconnect',
      context: { error },
    });
  }
};

const joinGeolocationHub = async (): Promise<void> => {
  // Zero arguments: the server method takes none and SignalR rejects a count mismatch.
  await signalRService.invoke(Env.REALTIME_GEO_HUB_NAME, 'GeolocationConnect');

  const isRejoin = geolocationHubHasJoined;
  geolocationHubJoined = true;
  geolocationHubHasJoined = true;

  if (isRejoin) {
    // Positions sent while we were out of the group were missed; let the maps catch up once.
    useSignalRStore.getState().requestMapRefresh();
  }
};

const rejoinGeolocationHub = async (): Promise<void> => {
  try {
    await joinGeolocationHub();
    logger.info({ message: 'Re-joined geolocation hub department group after reconnect' });
  } catch (error) {
    // The watchdog retries the join while the connection is up but not in its group.
    logger.error({
      message: 'Failed to re-join geolocation hub department group after reconnect',
      context: { error },
    });
  }
};

export const useSignalRStore = create<SignalRState>((set, get) => ({
  isUpdateHubConnected: false,
  lastUpdateMessage: null,
  lastUpdateTimestamp: 0,
  lastCallsTimestamp: 0,
  lastUnitsTimestamp: 0,
  lastPersonnelTimestamp: 0,
  isGeolocationHubConnected: false,
  lastGeolocationMessage: null,
  lastGeolocationTimestamp: 0,
  liveLocations: {},
  mapRefreshRequestTimestamp: 0,
  error: null,
  connectUpdateHub: async () => {
    updateHubWanted = true;

    try {
      // Only a connection that is really up AND in its department group counts: a stale flag must
      // never block a repair (the side menu syncs the flag from the transport state alone).
      if (get().isUpdateHubConnected && updateHubJoined && signalRService.isHubConnected(Env.CHANNEL_HUB_NAME)) {
        return;
      }

      set({ isUpdateHubConnected: false, error: null });

      // Get the eventing URL from the core store config
      let coreState = useCoreStore.getState();
      let eventingUrl = coreState.config?.EventingUrl;

      // If config is not loaded yet, wait for it to be fetched
      if (!eventingUrl) {
        logger.info({
          message: 'EventingUrl not available, waiting for config to be fetched...',
        });

        // Check if config is already being initialized
        if (!coreState.isInitialized && !coreState.isInitializing) {
          logger.info({
            message: 'Config not initialized, fetching config before SignalR connection',
          });
          try {
            await useCoreStore.getState().fetchConfig();
          } catch (configError) {
            const errorMessage = 'Failed to fetch config for SignalR connection';
            logger.error({
              message: errorMessage,
              context: { error: configError },
            });
            set({ error: new Error(errorMessage) });
            throw new Error(errorMessage);
          }
        } else if (coreState.isInitializing) {
          // Wait for initialization to complete (poll with timeout)
          logger.info({
            message: 'Config is being initialized, waiting for completion...',
          });
          const maxWaitTime = 10000; // 10 seconds
          const pollInterval = 100; // 100ms
          let waitedTime = 0;

          while (waitedTime < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            waitedTime += pollInterval;
            coreState = useCoreStore.getState();
            if (coreState.isInitialized && coreState.config?.EventingUrl) {
              break;
            }
          }
        }

        // Re-check for eventingUrl after waiting
        coreState = useCoreStore.getState();
        eventingUrl = coreState.config?.EventingUrl;

        if (!eventingUrl) {
          const errorMessage = 'EventingUrl not available in config after waiting. Please ensure config is loaded first.';
          logger.error({
            message: errorMessage,
          });
          set({ error: new Error(errorMessage) });
          throw new Error(errorMessage);
        }

        logger.info({
          message: 'EventingUrl now available, proceeding with SignalR connection',
          context: { eventingUrl },
        });
      }

      // Connect to the eventing hub
      await signalRService.connectToHubWithEventingUrl({
        name: Env.CHANNEL_HUB_NAME,
        eventingUrl: eventingUrl,
        hubName: Env.CHANNEL_HUB_NAME,
        methods: [
          'personnelStatusUpdated',
          'personnelStaffingUpdated',
          'unitStatusUpdated',
          'callsUpdated',
          'callAdded',
          'callClosed',
          'onConnected',
          'weatherAlertReceived',
          'weatherAlertUpdated',
          'weatherAlertExpired',
        ],
      });

      const departmentId = securityStore.getState().rights?.DepartmentId;
      if (!departmentId) {
        logger.warn({
          message: 'DepartmentId not available, skipping update hub connect invoke',
        });
      } else {
        await signalRService.invoke(Env.CHANNEL_HUB_NAME, 'connect', parseInt(departmentId, 10));
        markUpdateHubJoined();
      }

      if (!updateHubListenersRegistered) {
        updateHubListenersRegistered = true;

        signalRService.on('personnelStatusUpdated', (message) => {
          logger.info({
            message: 'personnelStatusUpdated',
          });
          set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now(), lastPersonnelTimestamp: Date.now() });
        });

        signalRService.on('personnelStaffingUpdated', (message) => {
          logger.info({
            message: 'personnelStaffingUpdated',
          });
          set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now(), lastPersonnelTimestamp: Date.now() });
        });

        signalRService.on('unitStatusUpdated', (message) => {
          logger.info({
            message: 'unitStatusUpdated',
          });
          set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now(), lastUnitsTimestamp: Date.now() });
        });

        signalRService.on('callsUpdated', (message) => {
          const now = Date.now();

          logger.info({
            message: 'callsUpdated',
            context: { now },
          });
          set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: now, lastCallsTimestamp: now });
        });

        signalRService.on('callAdded', (message) => {
          logger.info({
            message: 'callAdded',
          });
          set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now(), lastCallsTimestamp: Date.now() });
        });

        signalRService.on('callClosed', (message) => {
          logger.info({
            message: 'callClosed',
          });
          set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now(), lastCallsTimestamp: Date.now() });
        });

        signalRService.on('weatherAlertReceived', (message) => {
          if (typeof message !== 'string' || message.trim() === '') {
            logger.warn({ message: 'weatherAlertReceived: invalid payload', context: { message } });
            return;
          }
          const alertId = message.trim();
          logger.info({ message: 'weatherAlertReceived', context: { alertId } });
          useWeatherAlertsStore.getState().handleAlertReceived(alertId);
          set({ lastUpdateMessage: JSON.stringify({ type: 'weatherAlertReceived', alertId }), lastUpdateTimestamp: Date.now() });
        });

        signalRService.on('weatherAlertUpdated', (message) => {
          if (typeof message !== 'string' || message.trim() === '') {
            logger.warn({ message: 'weatherAlertUpdated: invalid payload', context: { message } });
            return;
          }
          const alertId = message.trim();
          logger.info({ message: 'weatherAlertUpdated', context: { alertId } });
          useWeatherAlertsStore.getState().handleAlertUpdated(alertId);
          set({ lastUpdateMessage: JSON.stringify({ type: 'weatherAlertUpdated', alertId }), lastUpdateTimestamp: Date.now() });
        });

        signalRService.on('weatherAlertExpired', (message) => {
          if (typeof message !== 'string' || message.trim() === '') {
            logger.warn({ message: 'weatherAlertExpired: invalid payload', context: { message } });
            return;
          }
          const alertId = message.trim();
          logger.info({ message: 'weatherAlertExpired', context: { alertId } });
          useWeatherAlertsStore.getState().handleAlertExpired(alertId);
          set({ lastUpdateMessage: JSON.stringify({ type: 'weatherAlertExpired', alertId }), lastUpdateTimestamp: Date.now() });
        });

        signalRService.on('onConnected', () => {
          logger.info({
            message: 'Connected to update SignalR hub',
          });
          set({ isUpdateHubConnected: true, error: null });
        });
      }

      // Connection state monitoring re-registers on each connect: disconnect
      // unregisters and nulls the handle, so guard on the handle rather than
      // the one-time listener flag above.
      if (!updateHubStateCallbackHandle) {
        updateHubStateCallbackHandle = signalRService.registerConnectionStateCallbacks(Env.CHANNEL_HUB_NAME, {
          onClose: () => {
            logger.info({
              message: 'Update SignalR hub connection closed',
            });
            updateHubJoined = false;
            set({ isUpdateHubConnected: false });
          },
          onReconnecting: () => {
            logger.info({
              message: 'Update SignalR hub reconnecting',
            });
            updateHubJoined = false;
            set({ isUpdateHubConnected: false });
          },
          onReconnected: () => {
            logger.info({
              message: 'Update SignalR hub reconnected',
            });
            // Fired for SignalR's automatic reconnect AND the service's rebuild after close. Either
            // way this is a new connection id that is not in the department group yet.
            updateHubJoined = false;
            set({ isUpdateHubConnected: true, error: null });
            void rejoinUpdateHub();
          },
          onError: (error) => {
            logger.error({
              message: 'Update SignalR hub connection error',
              context: { error },
            });
            set({ error });
          },
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to connect to SignalR hubs',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  disconnectUpdateHub: async () => {
    updateHubWanted = false;
    updateHubJoined = false;

    try {
      if (updateHubStateCallbackHandle) {
        signalRService.unregisterConnectionStateCallbacks(Env.CHANNEL_HUB_NAME, updateHubStateCallbackHandle);
        updateHubStateCallbackHandle = null;
      }
      await signalRService.disconnectFromHub(Env.CHANNEL_HUB_NAME);
      set({ isUpdateHubConnected: false, lastUpdateMessage: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to disconnect from SignalR hubs',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  reconnectUpdateHub: async () => {
    try {
      logger.info({
        message: 'Manual reconnection requested for update hub',
      });

      // Disconnect first to ensure clean state
      await get().disconnectUpdateHub();

      // Wait a moment before reconnecting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reconnect
      await get().connectUpdateHub();

      logger.info({
        message: 'Successfully reconnected to update hub',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to manually reconnect to update hub',
        context: { error: err },
      });
      set({ error: err });
      throw err;
    }
  },
  checkConnectionState: () => {
    // Check the actual connection state from the service
    const isActuallyConnected = signalRService.isHubConnected(Env.CHANNEL_HUB_NAME);
    const currentState = get().isUpdateHubConnected;

    // If the states don't match, update the store
    if (isActuallyConnected !== currentState) {
      logger.info({
        message: 'Connection state mismatch detected, updating store',
        context: { isActuallyConnected, currentState },
      });
      set({ isUpdateHubConnected: isActuallyConnected });
    }

    return isActuallyConnected;
  },
  connectGeolocationHub: async () => {
    geolocationHubWanted = true;

    try {
      // A stale flag must never block a repair: only a live connection that is in its group counts.
      if (get().isGeolocationHubConnected && geolocationHubJoined && signalRService.isHubConnected(Env.REALTIME_GEO_HUB_NAME)) {
        return;
      }

      set({ isGeolocationHubConnected: false, error: null });

      // Get the eventing URL from the core store config
      let coreState = useCoreStore.getState();
      let eventingUrl = coreState.config?.EventingUrl;

      // If config is not loaded yet, wait for it to be fetched
      if (!eventingUrl) {
        logger.info({
          message: 'EventingUrl not available for geolocation hub, waiting for config to be fetched...',
        });

        // Check if config is already being initialized
        if (!coreState.isInitialized && !coreState.isInitializing) {
          logger.info({
            message: 'Config not initialized, fetching config before geolocation hub connection',
          });
          try {
            await useCoreStore.getState().fetchConfig();
          } catch (configError) {
            const errorMessage = 'Failed to fetch config for geolocation hub connection';
            logger.error({
              message: errorMessage,
              context: { error: configError },
            });
            set({ error: new Error(errorMessage) });
            throw new Error(errorMessage);
          }
        } else if (coreState.isInitializing) {
          // Wait for initialization to complete (poll with timeout)
          logger.info({
            message: 'Config is being initialized, waiting for completion before geolocation hub connection...',
          });
          const maxWaitTime = 10000; // 10 seconds
          const pollInterval = 100; // 100ms
          let waitedTime = 0;

          while (waitedTime < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            waitedTime += pollInterval;
            coreState = useCoreStore.getState();
            if (coreState.isInitialized && coreState.config?.EventingUrl) {
              break;
            }
          }
        }

        // Re-check for eventingUrl after waiting
        coreState = useCoreStore.getState();
        eventingUrl = coreState.config?.EventingUrl;

        if (!eventingUrl) {
          const errorMessage = 'EventingUrl not available in config for geolocation hub after waiting';
          logger.error({ message: errorMessage });
          set({ error: new Error(errorMessage) });
          throw new Error(errorMessage);
        }

        logger.info({
          message: 'EventingUrl now available, proceeding with geolocation hub connection',
          context: { eventingUrl },
        });
      }

      // Listeners first, so the join reply and the first pushes cannot slip past. The service's
      // emitter is process-wide and outlives connections, so this happens once (idempotent).
      if (!geolocationHubListenersRegistered) {
        geolocationHubListenersRegistered = true;

        const applyLocationPush = (update: LiveLocation | null) => {
          // Not logged: a tracker with no fix reports 0,0 on every push, which would flood the log
          // the same way the service's per-message lines did (see UNLOGGED_HUB_METHODS).
          if (!update) {
            return;
          }

          set((state) => {
            const liveLocations = mergeLiveLocation(state.liveLocations, update);
            if (liveLocations === state.liveLocations) {
              // Older than the fix already held (replayed/reordered) or an exact duplicate.
              return state;
            }

            return { liveLocations, lastGeolocationMessage: update, lastGeolocationTimestamp: update.receivedAt };
          });
        };

        signalRService.on('onUnitLocationUpdated', (message) => {
          applyLocationPush(parseUnitLocationUpdate(message));
        });

        signalRService.on('onPersonnelLocationUpdated', (message) => {
          applyLocationPush(parsePersonnelLocationUpdate(message));
        });

        signalRService.on('onGeolocationConnect', (connectionId) => {
          // A late reply for a connection we have since dropped must not claim we are connected.
          if (!geolocationHubWanted || !signalRService.isHubConnected(Env.REALTIME_GEO_HUB_NAME)) {
            return;
          }

          logger.info({
            message: 'Joined geolocation hub department group',
            context: { connectionId },
          });
          set({ isGeolocationHubConnected: true });
        });
      }

      if (!geolocationHubStateCallbackHandle) {
        geolocationHubStateCallbackHandle = signalRService.registerConnectionStateCallbacks(Env.REALTIME_GEO_HUB_NAME, {
          onClose: () => {
            logger.info({ message: 'Geolocation hub connection closed' });
            geolocationHubJoined = false;
            set({ isGeolocationHubConnected: false });
          },
          onReconnecting: () => {
            logger.info({ message: 'Geolocation hub reconnecting' });
            geolocationHubJoined = false;
            set({ isGeolocationHubConnected: false });
          },
          onReconnected: () => {
            // Automatic reconnect or the service's rebuild after close: a new connection id that is
            // not in the department group until GeolocationConnect is invoked again.
            logger.info({ message: 'Geolocation hub reconnected, re-joining department group' });
            geolocationHubJoined = false;
            set({ isGeolocationHubConnected: false });
            void rejoinGeolocationHub();
          },
          onError: (error) => {
            logger.warn({
              message: 'Geolocation hub connection error',
              context: { error },
            });
          },
        });
      }

      await signalRService.connectToHubWithEventingUrl({
        name: Env.REALTIME_GEO_HUB_NAME,
        eventingUrl: eventingUrl,
        hubName: Env.REALTIME_GEO_HUB_NAME,
        methods: GEOLOCATION_HUB_METHODS,
      });

      await joinGeolocationHub();

      logger.info({ message: 'Geolocation hub connected' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to connect to geolocation hub',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  disconnectGeolocationHub: async () => {
    geolocationHubWanted = false;
    geolocationHubJoined = false;

    try {
      if (geolocationHubStateCallbackHandle) {
        signalRService.unregisterConnectionStateCallbacks(Env.REALTIME_GEO_HUB_NAME, geolocationHubStateCallbackHandle);
        geolocationHubStateCallbackHandle = null;
      }
      set({ isGeolocationHubConnected: false, lastGeolocationMessage: null });
      await signalRService.disconnectFromHub(Env.REALTIME_GEO_HUB_NAME);
      logger.info({ message: 'Geolocation hub disconnected' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to disconnect from geolocation hub',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  requestMapRefresh: () => {
    // Strictly greater than both stamps the map hook watches, so the request is never swallowed by
    // an update that landed in the same millisecond (or by a clock that stepped backwards).
    set((state) => ({
      mapRefreshRequestTimestamp: Math.max(Date.now(), state.mapRefreshRequestTimestamp + 1, state.lastUpdateTimestamp + 1),
    }));
  },
  reportUnknownLivePins: (pinIds: string[]) => {
    const now = Date.now();
    let accepted = false;

    for (const pinId of pinIds) {
      const lastRequestedAt = unknownPinRefreshLog.get(pinId);
      if (lastRequestedAt !== undefined && now - lastRequestedAt < UNKNOWN_PIN_REFRESH_COOLDOWN_MS) {
        continue;
      }

      unknownPinRefreshLog.set(pinId, now);
      accepted = true;
    }

    if (!accepted || unknownPinRefreshTimer) {
      return;
    }

    // Keep the log from growing without bound on a long-running board.
    unknownPinRefreshLog.forEach((requestedAt, pinId) => {
      if (now - requestedAt >= UNKNOWN_PIN_REFRESH_COOLDOWN_MS) {
        unknownPinRefreshLog.delete(pinId);
      }
    });

    logger.debug({
      message: 'Live location for a pin the map does not have, scheduling a map refetch',
      context: { pinIds },
    });

    unknownPinRefreshTimer = setTimeout(() => {
      unknownPinRefreshTimer = null;
      get().requestMapRefresh();
    }, UNKNOWN_PIN_REFRESH_DELAY_MS);
  },
  clearLiveLocations: () => {
    unknownPinRefreshLog.clear();
    if (unknownPinRefreshTimer) {
      clearTimeout(unknownPinRefreshTimer);
      unknownPinRefreshTimer = null;
    }
    geolocationHubHasJoined = false;
    set({ liveLocations: {}, lastGeolocationMessage: null, lastGeolocationTimestamp: 0 });
  },
  ensureHubConnections: async () => {
    const now = Date.now();

    if (updateHubWanted) {
      const hubName = Env.CHANNEL_HUB_NAME;
      // "Not available" means no connection, no automatic reconnect and no scheduled rebuild: the
      // service has given up (max attempts, or a rebuild that failed while the network was down).
      const lost = !signalRService.isHubAvailable(hubName);
      const notInGroup = signalRService.isHubConnected(hubName) && !updateHubJoined;

      if ((lost || notInGroup) && canAttemptHubRepair(hubName, now)) {
        logger.warn({ message: 'Update hub watchdog: repairing connection', context: { lost, notInGroup } });
        await get().connectUpdateHub();
        recordHubRepairResult(hubName, signalRService.isHubConnected(hubName) && updateHubJoined, now);
      }
    }

    if (geolocationHubWanted) {
      const hubName = Env.REALTIME_GEO_HUB_NAME;
      const lost = !signalRService.isHubAvailable(hubName);
      const notInGroup = signalRService.isHubConnected(hubName) && !geolocationHubJoined;

      if ((lost || notInGroup) && canAttemptHubRepair(hubName, now)) {
        logger.warn({ message: 'Geolocation hub watchdog: repairing connection', context: { lost, notInGroup } });
        await get().connectGeolocationHub();
        recordHubRepairResult(hubName, signalRService.isHubConnected(hubName) && geolocationHubJoined, now);
      }
    }
  },
}));
