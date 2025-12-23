import { ConnectionState, type LocalParticipant, type Participant, type RemoteParticipant, Room, type RoomConnectOptions, RoomEvent, type RoomOptions } from 'livekit-client'; // livekit-react-native re-exports these
import { Platform } from 'react-native';
import create from 'zustand';

import { logger } from '../../../lib/logging';

// Platform-specific imports
let callKeepService: any;
if (Platform.OS === 'ios') {
  callKeepService = require('../../../services/callkeep.service.ios').callKeepService;
} else {
  callKeepService = require('../../../services/callkeep.service.web').callKeepService;
}

export interface RoomInfo {
  id: string;
  name: string;
}

interface LiveKitCallState {
  availableRooms: RoomInfo[];
  selectedRoomForJoining: string | null;
  currentRoomId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  roomInstance: Room | null;
  participants: Participant[]; // Includes local participant
  error: string | null;
  localParticipant: LocalParticipant | null;

  actions: {
    setSelectedRoomForJoining: (roomId: string | null) => void;
    connectToRoom: (roomId: string, participantIdentity: string) => Promise<void>;
    disconnectFromRoom: () => Promise<void>;
    setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
    // Internal actions - not typically called directly from UI
    _setRoomInstance: (room: Room | null) => void;
    _setIsConnected: (isConnected: boolean) => void;
    _setIsConnecting: (isConnecting: boolean) => void;
    _addParticipant: (participant: Participant) => void;
    _removeParticipant: (participantId: string) => void;
    _updateParticipants: () => void;
    _clearError: () => void;
  };
}

const initialRooms: RoomInfo[] = [
  { id: 'general-chat', name: 'General Chat' },
  { id: 'dev-team-sync', name: 'Dev Team Sync' },
  { id: 'product-updates', name: 'Product Updates' },
];

export const useLiveKitCallStore = create<LiveKitCallState>((set, get) => ({
  availableRooms: initialRooms,
  selectedRoomForJoining: null,
  currentRoomId: null,
  isConnecting: false,
  isConnected: false,
  roomInstance: null,
  participants: [],
  error: null,
  localParticipant: null,

  actions: {
    setSelectedRoomForJoining: (roomId) => set({ selectedRoomForJoining: roomId, error: null }),
    _clearError: () => set({ error: null }),

    connectToRoom: async (roomId, participantIdentity) => {
      if (get().isConnecting || get().isConnected) {
        logger.warn({
          message: 'Connection attempt while already connecting or connected',
          context: { roomId, participantIdentity, isConnecting: get().isConnecting, isConnected: get().isConnected },
        });
        return;
      }

      set({ isConnecting: true, error: null, selectedRoomForJoining: roomId });

      // Register CallKeep mute callback for iOS
      if (Platform.OS === 'ios') {
        callKeepService.setMuteStateCallback((muted: boolean) => {
          const currentState = get();
          if (currentState.isConnected && currentState.roomInstance) {
            currentState.actions.setMicrophoneEnabled(!muted);
          }
        });
      }

      try {
        const roomOptions: RoomOptions = {
          adaptiveStream: true,
          dynacast: true, // Enable dynamic simulcast
        };
        const newRoom = new Room(roomOptions);

        newRoom
          .on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
            logger.info({
              message: 'LiveKit Connection State Changed',
              context: { state, roomId },
            });
            if (state === ConnectionState.Connected) {
              set({
                isConnected: true,
                isConnecting: false,
                currentRoomId: roomId,
                roomInstance: newRoom,
                localParticipant: newRoom.localParticipant,
                error: null,
              });
              get().actions._updateParticipants(); // Initial participant list
              newRoom.localParticipant.setMicrophoneEnabled(true);
              newRoom.localParticipant.setCameraEnabled(false); // No video

              // Start CallKeep call for iOS background audio support
              if (Platform.OS === 'ios') {
                callKeepService
                  .startCall(roomId)
                  .then((callUUID: string) => {
                    logger.info({
                      message: 'CallKeep call started successfully',
                      context: { callUUID, roomId },
                    });
                  })
                  .catch((error: unknown) => {
                    logger.warn({
                      message: 'Failed to start CallKeep call (background audio may not work)',
                      context: { error, roomId },
                    });
                  });
              }
            } else if (state === ConnectionState.Disconnected) {
              set({
                isConnected: false,
                isConnecting: false,
                currentRoomId: null,
                roomInstance: null,
                participants: [],
                localParticipant: null,
                // Keep error if there was one leading to disconnect
              });

              // End CallKeep call for iOS when disconnected
              if (Platform.OS === 'ios') {
                callKeepService
                  .endCall()
                  .then(() => {
                    logger.info({
                      message: 'CallKeep call ended on disconnect',
                      context: { roomId },
                    });
                  })
                  .catch((error: unknown) => {
                    logger.warn({
                      message: 'Failed to end CallKeep call on disconnect',
                      context: { error, roomId },
                    });
                  });
              }
            } else if (state === ConnectionState.Connecting) {
              set({ isConnecting: true });
            } else if (state === ConnectionState.Reconnecting) {
              set({ isConnecting: true, error: 'Connection lost, attempting to reconnect...' });
            }
          })
          .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
            logger.info({
              message: 'Participant connected',
              context: { participantIdentity: participant.identity, roomId },
            });
            get().actions._addParticipant(participant);
          })
          .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
            logger.info({
              message: 'Participant disconnected',
              context: { participantIdentity: participant.identity, roomId },
            });
            get().actions._removeParticipant(participant.sid);
          })
          .on(RoomEvent.LocalTrackPublished, (trackPublication, participant) => {
            logger.debug({
              message: 'Local track published',
              context: { trackKind: trackPublication.kind, participantIdentity: participant.identity, roomId },
            });
            get().actions._updateParticipants(); // Ensure local participant updates reflect
          })
          .on(RoomEvent.LocalTrackUnpublished, (trackPublication, participant) => {
            logger.debug({
              message: 'Local track unpublished',
              context: { trackKind: trackPublication.kind, participantIdentity: participant.identity, roomId },
            });
            get().actions._updateParticipants();
          })
          .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            logger.debug({
              message: 'Subscribed to track',
              context: {
                trackSid: publication.trackSid,
                trackKind: track.kind,
                participantIdentity: participant.identity,
                roomId,
              },
            });
            // Audio tracks are usually auto-played. No specific handling needed here for audio only.
          })
          .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            logger.debug({
              message: 'Unsubscribed from track',
              context: {
                trackSid: publication.trackSid,
                participantIdentity: participant.identity,
                roomId,
              },
            });
          })
          .on(RoomEvent.Disconnected, (reason) => {
            logger.info({
              message: 'Disconnected from room',
              context: { reason: String(reason), roomId },
            });
            // DisconnectReason is an enum of strings like 'CLIENT_INITIATED', etc.
            const reasonMsg = reason ? String(reason) : 'Unknown reason';
            set({ error: `Disconnected: ${reasonMsg}` });
            // Full cleanup is also handled by ConnectionStateChanged to Disconnected
          });

        const connectOptions: RoomConnectOptions = {
          autoSubscribe: true, // Subscribe to all tracks by default
        };

        //await newRoom.connect(LIVEKIT_URL, token, connectOptions);
        // Connection success is handled by the ConnectionStateChanged event listener
      } catch (err: any) {
        logger.error({
          message: 'Failed to connect to LiveKit room',
          context: { error: err, roomId, participantIdentity },
        });
        set({
          error: err.message || 'An unknown error occurred during connection.',
          isConnecting: false,
          isConnected: false,
          roomInstance: null,
          currentRoomId: null,
        });
        // Clean up any partially initialized room
        if (get().roomInstance) {
          await get().roomInstance?.disconnect();
          set({ roomInstance: null });
        }
      }
    },

    disconnectFromRoom: async () => {
      const room = get().roomInstance;
      if (room) {
        logger.info({
          message: 'Disconnecting from room',
          context: { roomName: room.name, currentRoomId: get().currentRoomId },
        });
        await room.disconnect();
        // State updates (isConnected, currentRoomId, etc.) are handled by RoomEvent.Disconnected
        // and ConnectionState.Disconnected listeners.
        set({
          roomInstance: null,
          currentRoomId: null,
          isConnected: false,
          isConnecting: false,
          participants: [],
          localParticipant: null,
          selectedRoomForJoining: null, // Reset selection
        });

        // End CallKeep call for iOS
        if (Platform.OS === 'ios') {
          try {
            await callKeepService.endCall();
            // Clear the mute state callback
            callKeepService.setMuteStateCallback(null);
            logger.info({
              message: 'CallKeep call ended successfully',
            });
          } catch (error) {
            logger.warn({
              message: 'Failed to end CallKeep call',
              context: { error },
            });
          }
        }
      }
    },

    setMicrophoneEnabled: async (enabled: boolean) => {
      const room = get().roomInstance;
      if (room && room.localParticipant) {
        try {
          await room.localParticipant.setMicrophoneEnabled(enabled);
          get().actions._updateParticipants(); // reflect change in participant state
          logger.info({
            message: 'Microphone state changed',
            context: { enabled, participantIdentity: room.localParticipant.identity },
          });
        } catch (e) {
          logger.error({
            message: 'Error setting microphone state',
            context: { error: e, enabled },
          });
          set({ error: 'Could not change microphone state.' });
        }
      }
    },

    _setRoomInstance: (room) => set({ roomInstance: room }),
    _setIsConnected: (isConnected) => set({ isConnected }),
    _setIsConnecting: (isConnecting) => set({ isConnecting }),

    _addParticipant: (participant) => {
      set((state) => {
        if (!state.participants.find((p) => p.sid === participant.sid)) {
          return { participants: [...state.participants, participant] };
        }
        return {}; // No change
      });
    },
    _removeParticipant: (participantSid) => {
      set((state) => ({
        participants: state.participants.filter((p) => p.sid !== participantSid),
      }));
    },
    _updateParticipants: () => {
      const room = get().roomInstance;
      if (room) {
        // Use room.remoteParticipants which is Map<ParticipantSid, RemoteParticipant>
        const remoteParticipantsArray: RemoteParticipant[] = Array.from(room.remoteParticipants.values());
        const allParticipants: Participant[] = [room.localParticipant, ...remoteParticipantsArray];
        set({
          participants: allParticipants,
          localParticipant: room.localParticipant,
        });
      }
    },
  },
}));

// Selector for convenience
export const useLiveKit = useLiveKitCallStore;

// Example on how to listen to participant's microphone status
// This would typically be in a component that renders a participant
/*
const { isMuted } = useParticipantTrack({
  participant: remoteParticipant,
  source: Track.Source.Microphone,
  publication: remoteParticipant.getTrackPublication(Track.Source.Microphone),
});
*/
