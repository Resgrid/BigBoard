import { type HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import useAuthStore from '@/stores/auth/store';

export interface SignalRHubConfig {
  name: string;
  url: string;
  methods: string[];
}

export interface SignalRHubConnectConfig {
  name: string;
  eventingUrl: string; // Base EventingUrl from config (trailing slash will be added if missing)
  hubName: string;
  methods: string[];
}

export interface SignalRMessage {
  type: string;
  data: unknown;
}

export enum HubConnectingState {
  IDLE = 'idle',
  RECONNECTING = 'reconnecting',
  DIRECT_CONNECTING = 'direct-connecting',
}

class SignalRService {
  private connections: Map<string, HubConnection> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private hubConfigs: Map<string, SignalRHubConnectConfig> = new Map();
  private connectionLocks: Map<string, Promise<void>> = new Map();
  private reconnectingHubs: Set<string> = new Set();
  private hubStates: Map<string, HubConnectingState> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_INTERVAL = 5000; // 5 seconds

  private static instance: SignalRService | null = null;

  private constructor() {}

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
      logger.info({
        message: 'SignalR service singleton instance created',
      });
    }

    return SignalRService.instance;
  }

  /**
   * Check if a hub is connected or in the process of connecting
   */
  public isHubAvailable(hubName: string): boolean {
    return this.connections.has(hubName) || this.isHubConnecting(hubName);
  }

  /**
   * Check if a hub is in any connecting state (reconnecting or direct-connecting)
   */
  private isHubConnecting(hubName: string): boolean {
    const state = this.hubStates.get(hubName);
    return state === HubConnectingState.RECONNECTING || state === HubConnectingState.DIRECT_CONNECTING;
  }

  /**
   * Check if a hub is specifically in reconnecting state
   * @deprecated Use for testing purposes only
   */
  public isHubReconnecting(hubName: string): boolean {
    return this.hubStates.get(hubName) === HubConnectingState.RECONNECTING;
  }

  /**
   * Set hub state and manage legacy reconnectingHubs set for backward compatibility
   */
  private setHubState(hubName: string, state: HubConnectingState): void {
    if (state === HubConnectingState.IDLE) {
      this.hubStates.delete(hubName);
      this.reconnectingHubs.delete(hubName);
    } else {
      this.hubStates.set(hubName, state);
      if (state === HubConnectingState.RECONNECTING) {
        this.reconnectingHubs.add(hubName);
      } else {
        this.reconnectingHubs.delete(hubName);
      }
    }
  }

  public async connectToHubWithEventingUrl(config: SignalRHubConnectConfig): Promise<void> {
    // Check for existing lock to prevent concurrent connections to the same hub
    const existingLock = this.connectionLocks.get(config.name);
    if (existingLock) {
      logger.info({
        message: `Connection to hub ${config.name} is already in progress, waiting...`,
      });
      await existingLock;
      return;
    }

    // Create a new connection promise and store it as a lock
    const connectionPromise = this._connectToHubWithEventingUrlInternal(config);
    this.connectionLocks.set(config.name, connectionPromise);

    try {
      await connectionPromise;
    } finally {
      // Remove the lock after connection completes (success or failure)
      this.connectionLocks.delete(config.name);
    }
  }

  private async _connectToHubWithEventingUrlInternal(config: SignalRHubConnectConfig): Promise<void> {
    try {
      if (this.connections.has(config.name)) {
        logger.info({
          message: `Already connected to hub: ${config.name}`,
        });
        return;
      }

      // Check if hub is already in direct-connecting state to prevent duplicates
      const currentState = this.hubStates.get(config.name);
      if (currentState === HubConnectingState.DIRECT_CONNECTING) {
        logger.info({
          message: `Hub ${config.name} is already in direct-connecting state, skipping duplicate connection attempt`,
        });
        return;
      }

      // Log if hub is reconnecting but proceed with direct connection attempt
      if (currentState === HubConnectingState.RECONNECTING) {
        logger.info({
          message: `Hub ${config.name} is currently reconnecting, proceeding with direct connection attempt`,
        });
      }

      // Mark as direct-connecting
      this.setHubState(config.name, HubConnectingState.DIRECT_CONNECTING);

      const token = useAuthStore.getState().accessToken;
      if (!token) {
        throw new Error('No authentication token available');
      }

      if (!config.eventingUrl) {
        throw new Error('EventingUrl is required for SignalR connection');
      }

      // Parse the incoming eventingUrl into path and query components
      const url = new URL(config.eventingUrl);

      // Append the hub name to the path (ensuring a single slash)
      const pathWithHub = url.pathname.endsWith('/') ? `${url.pathname}${config.hubName}` : `${url.pathname}/${config.hubName}`;

      // Reassemble the URL with the hub in the path
      let fullUrl = `${url.protocol}//${url.host}${pathWithHub}`;

      // For geolocation hub, add token as URL parameter instead of header
      const isGeolocationHub = config.hubName === Env.REALTIME_GEO_HUB_NAME;

      // Merge existing query parameters with access_token if needed
      const queryParams = new URLSearchParams(url.search);
      if (isGeolocationHub) {
        queryParams.set('access_token', token);
      }

      // Add query string if there are any parameters
      if (queryParams.toString()) {
        fullUrl = `${fullUrl}?${queryParams.toString()}`;
      }

      logger.info({
        message: `Connecting to hub: ${config.name}`,
        context: { config, fullUrl: isGeolocationHub ? fullUrl.replace(/access_token=[^&]+/, 'access_token=***') : fullUrl },
      });

      // Store the config for potential reconnections
      this.hubConfigs.set(config.name, config);

      const connectionBuilder = new HubConnectionBuilder()
        .withUrl(
          fullUrl,
          isGeolocationHub
            ? {}
            : {
                accessTokenFactory: () => token,
              }
        )
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Information);

      const connection = connectionBuilder.build();

      // Set up event handlers
      connection.onclose(() => {
        this.handleConnectionClose(config.name);
      });

      connection.onreconnecting((error) => {
        logger.warn({
          message: `Reconnecting to hub: ${config.name}`,
          context: { error },
        });
      });

      connection.onreconnected((connectionId) => {
        logger.info({
          message: `Reconnected to hub: ${config.name}`,
          context: { connectionId },
        });
        this.reconnectAttempts.set(config.name, 0);
      });

      // Register all methods
      config.methods.forEach((method) => {
        logger.info({
          message: `Registering ${method} message from hub: ${config.name}`,
          context: { method },
        });

        connection.on(method, (data) => {
          logger.info({
            message: `Received ${method} message from hub: ${config.name}`,
            context: { method, data },
          });
          this.handleMessage(config.name, method, data);
        });
      });

      await connection.start();
      this.connections.set(config.name, connection);
      this.reconnectAttempts.set(config.name, 0);

      // Clear the direct-connecting state on successful connection
      this.setHubState(config.name, HubConnectingState.IDLE);

      logger.info({
        message: `Connected to hub: ${config.name}`,
      });
    } catch (error) {
      // Clear the direct-connecting state on failed connection
      this.setHubState(config.name, HubConnectingState.IDLE);

      logger.error({
        message: `Failed to connect to hub: ${config.name}`,
        context: { error },
      });
      throw error;
    }
  }

  public async connectToHub(config: SignalRHubConfig): Promise<void> {
    // Check for existing lock to prevent concurrent connections to the same hub
    const existingLock = this.connectionLocks.get(config.name);
    if (existingLock) {
      logger.info({
        message: `Connection to hub ${config.name} is already in progress, waiting...`,
      });
      await existingLock;
      return;
    }

    // Create a new connection promise and store it as a lock
    const connectionPromise = this._connectToHubInternal(config);
    this.connectionLocks.set(config.name, connectionPromise);

    try {
      await connectionPromise;
    } finally {
      // Remove the lock after connection completes (success or failure)
      this.connectionLocks.delete(config.name);
    }
  }

  private async _connectToHubInternal(config: SignalRHubConfig): Promise<void> {
    try {
      if (this.connections.has(config.name)) {
        logger.info({
          message: `Already connected to hub: ${config.name}`,
        });
        return;
      }

      // Check if hub is already in direct-connecting state to prevent duplicates
      const currentState = this.hubStates.get(config.name);
      if (currentState === HubConnectingState.DIRECT_CONNECTING) {
        logger.info({
          message: `Hub ${config.name} is already in direct-connecting state, skipping duplicate connection attempt`,
        });
        return;
      }

      // Log if hub is reconnecting but proceed with direct connection attempt
      if (currentState === HubConnectingState.RECONNECTING) {
        logger.info({
          message: `Hub ${config.name} is currently reconnecting, proceeding with direct connection attempt`,
        });
      }

      // Mark as direct-connecting
      this.setHubState(config.name, HubConnectingState.DIRECT_CONNECTING);

      const token = useAuthStore.getState().accessToken;
      if (!token) {
        throw new Error('No authentication token available');
      }

      logger.info({
        message: `Connecting to hub: ${config.name}`,
        context: { config },
      });

      const connection = new HubConnectionBuilder()
        .withUrl(config.url, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      connection.onclose(() => {
        this.handleConnectionClose(config.name);
      });

      connection.onreconnecting((error) => {
        logger.warn({
          message: `Reconnecting to hub: ${config.name}`,
          context: { error },
        });
      });

      connection.onreconnected((connectionId) => {
        logger.info({
          message: `Reconnected to hub: ${config.name}`,
          context: { connectionId },
        });
        this.reconnectAttempts.set(config.name, 0);
      });

      // Register all methods
      config.methods.forEach((method) => {
        logger.info({
          message: `Registering ${method} message from hub: ${config.name}`,
          context: { method },
        });

        connection.on(method, (data) => {
          logger.info({
            message: `Received ${method} message from hub: ${config.name}`,
            context: { method, data },
          });
          this.handleMessage(config.name, method, data);
        });
      });

      await connection.start();
      this.connections.set(config.name, connection);
      this.reconnectAttempts.set(config.name, 0);

      // Clear the direct-connecting state on successful connection
      this.setHubState(config.name, HubConnectingState.IDLE);

      logger.info({
        message: `Connected to hub: ${config.name}`,
      });
    } catch (error) {
      // Clear the direct-connecting state on failed connection
      this.setHubState(config.name, HubConnectingState.IDLE);

      logger.error({
        message: `Failed to connect to hub: ${config.name}`,
        context: { error },
      });
      throw error;
    }
  }

  private handleConnectionClose(hubName: string): void {
    const attempts = this.reconnectAttempts.get(hubName) || 0;
    if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts.set(hubName, attempts + 1);
      const currentAttempts = attempts + 1;

      const hubConfig = this.hubConfigs.get(hubName);
      if (hubConfig) {
        logger.info({
          message: `Scheduling reconnection attempt ${currentAttempts}/${this.MAX_RECONNECT_ATTEMPTS} for hub: ${hubName}`,
        });

        setTimeout(async () => {
          try {
            // Check if the hub config was removed (e.g., by explicit disconnect)
            const currentHubConfig = this.hubConfigs.get(hubName);
            if (!currentHubConfig) {
              logger.debug({
                message: `Hub ${hubName} config was removed, skipping reconnection attempt`,
              });
              return;
            }

            // If a live connection exists, skip; if it's stale/closed, drop it
            const existingConn = this.connections.get(hubName);
            if (existingConn && existingConn.state === HubConnectionState.Connected) {
              logger.debug({
                message: `Hub ${hubName} is already connected, skipping reconnection attempt`,
              });
              return;
            }

            // Mark as reconnecting and remove stale entry (if any) to allow a fresh connect
            this.setHubState(hubName, HubConnectingState.RECONNECTING);
            if (existingConn) {
              this.connections.delete(hubName);
            }

            try {
              // Refresh authentication token before reconnecting
              logger.info({
                message: `Refreshing authentication token before reconnecting to hub: ${hubName}`,
              });

              await useAuthStore.getState().refreshAccessToken();

              // Verify we have a valid token after refresh
              const token = useAuthStore.getState().accessToken;
              if (!token) {
                throw new Error('No valid authentication token available after refresh');
              }

              logger.info({
                message: `Token refreshed successfully, attempting to reconnect to hub: ${hubName} (attempt ${currentAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`,
              });

              // Remove the connection from our maps to allow fresh connection
              // This is now safe because we have the reconnecting flag set
              this.connections.delete(hubName);

              await this.connectToHubWithEventingUrl(currentHubConfig);

              // Clear reconnecting state on successful reconnection
              this.setHubState(hubName, HubConnectingState.IDLE);

              logger.info({
                message: `Successfully reconnected to hub: ${hubName} after ${currentAttempts} attempts`,
              });
            } catch (reconnectionError) {
              // Clear reconnecting state on failed reconnection
              this.setHubState(hubName, HubConnectingState.IDLE);

              logger.error({
                message: `Failed to refresh token or reconnect to hub: ${hubName}`,
                context: { error: reconnectionError, attempts: currentAttempts, maxAttempts: this.MAX_RECONNECT_ATTEMPTS },
              });

              // Re-throw to trigger the outer catch block
              throw reconnectionError;
            }
          } catch (error) {
            // This catch block handles the overall reconnection attempt failure
            // The reconnecting flag has already been cleared in the inner catch block
            logger.error({
              message: `Reconnection attempt failed for hub: ${hubName}`,
              context: { error, attempts: currentAttempts, maxAttempts: this.MAX_RECONNECT_ATTEMPTS },
            });

            // Don't immediately retry; let the next connection close event trigger another attempt
            // This prevents rapid retry loops that could overwhelm the server
          }
        }, this.RECONNECT_INTERVAL);
      } else {
        logger.error({
          message: `No stored config found for hub: ${hubName}, cannot attempt reconnection`,
        });
      }
    } else {
      logger.error({
        message: `Max reconnection attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached for hub: ${hubName}`,
      });

      // Clean up resources for this failed connection
      this.connections.delete(hubName);
      this.reconnectAttempts.delete(hubName);
      this.hubConfigs.delete(hubName);
      this.setHubState(hubName, HubConnectingState.IDLE);
    }
  }

  private handleMessage(hubName: string, method: string, data: unknown): void {
    logger.debug({
      message: `Received message from hub: ${hubName}`,
      context: { method, data },
    });
    // Emit event for subscribers using the method name as the event name
    this.emit(method, data);
  }

  public async disconnectFromHub(hubName: string): Promise<void> {
    // Wait for any ongoing connection attempt to complete
    const existingLock = this.connectionLocks.get(hubName);
    if (existingLock) {
      logger.info({
        message: `Waiting for ongoing connection to hub ${hubName} to complete before disconnecting`,
      });
      try {
        await existingLock;
      } catch (error) {
        // Ignore connection errors when we're trying to disconnect
        logger.debug({
          message: `Connection attempt failed while waiting to disconnect from hub ${hubName}`,
          context: { error },
        });
      }
    }

    const connection = this.connections.get(hubName);
    if (connection) {
      try {
        await connection.stop();
        this.connections.delete(hubName);
        this.reconnectAttempts.delete(hubName);
        this.hubConfigs.delete(hubName);
        this.setHubState(hubName, HubConnectingState.IDLE);
        logger.info({
          message: `Disconnected from hub: ${hubName}`,
        });
      } catch (error) {
        logger.error({
          message: `Error disconnecting from hub: ${hubName}`,
          context: { error },
        });
        throw error;
      }
    } else {
      // Even if no connection exists, clear the state in case it's set
      this.setHubState(hubName, HubConnectingState.IDLE);
      this.reconnectAttempts.delete(hubName);
      this.hubConfigs.delete(hubName);
    }
  }

  public async invoke(hubName: string, method: string, data: unknown): Promise<void> {
    // Wait for any ongoing connection attempt to complete
    const existingLock = this.connectionLocks.get(hubName);
    if (existingLock) {
      logger.debug({
        message: `Waiting for ongoing connection to hub ${hubName} to complete before invoking method`,
        context: { method },
      });
      await existingLock;
    }

    const connection = this.connections.get(hubName);
    if (connection) {
      try {
        return await connection.invoke(method, data);
      } catch (error) {
        logger.error({
          message: `Error invoking method ${method} from hub: ${hubName}`,
          context: { error },
        });
        throw error;
      }
    } else if (this.reconnectingHubs.has(hubName)) {
      throw new Error(`Cannot invoke method ${method} on hub ${hubName}: hub is currently reconnecting`);
    } else {
      throw new Error(`Cannot invoke method ${method} on hub ${hubName}: hub is not connected`);
    }
  }

  // Method to reset the singleton instance (primarily for testing)
  public static resetInstance(): void {
    if (SignalRService.instance) {
      // Disconnect all connections before resetting
      SignalRService.instance.disconnectAll().catch((error) => {
        logger.error({
          message: 'Error disconnecting all hubs during instance reset',
          context: { error },
        });
      });
    }
    SignalRService.instance = null;
    logger.debug({
      message: 'SignalR service singleton instance reset',
    });
  }

  public async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map((hubName) => this.disconnectFromHub(hubName));
    await Promise.all(disconnectPromises);
  }

  // Event emitter methods
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  public on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  public off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }

  /**
   * Get the actual connection state of a hub
   */
  public getHubConnectionState(hubName: string): HubConnectionState | null {
    const connection = this.connections.get(hubName);
    return connection ? connection.state : null;
  }

  /**
   * Check if a hub is currently connected
   */
  public isHubConnected(hubName: string): boolean {
    const connection = this.connections.get(hubName);
    return connection?.state === HubConnectionState.Connected;
  }
}

export const signalRService = SignalRService.getInstance();
export { SignalRService };
