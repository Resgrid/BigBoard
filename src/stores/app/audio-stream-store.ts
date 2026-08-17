import { type AudioPlayer, type AudioStatus, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { type EventSubscription } from 'expo-modules-core';
import { create } from 'zustand';

import { getDepartmentAudioStreams } from '@/api/voice';
import { logger } from '@/lib/logging';
import { type DepartmentAudioResultStreamData } from '@/models/v4/voice/departmentAudioResultStreamData';

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let statusSubscription: EventSubscription | null = null;

interface AudioStreamState {
  // Available streams
  availableStreams: DepartmentAudioResultStreamData[];
  isLoadingStreams: boolean;

  // Current stream
  currentStream: DepartmentAudioResultStreamData | null;
  soundObject: AudioPlayer | null;
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;

  // UI state
  isBottomSheetVisible: boolean;

  // Actions
  setAvailableStreams: (streams: DepartmentAudioResultStreamData[]) => void;
  setIsLoadingStreams: (loading: boolean) => void;
  setCurrentStream: (stream: DepartmentAudioResultStreamData | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setIsBottomSheetVisible: (visible: boolean) => void;

  // Stream operations
  fetchAvailableStreams: () => Promise<void>;
  playStream: (stream: DepartmentAudioResultStreamData) => Promise<void>;
  stopStream: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export const useAudioStreamStore = create<AudioStreamState>((set, get) => ({
  availableStreams: [],
  isLoadingStreams: false,
  currentStream: null,
  soundObject: null,
  isPlaying: false,
  isLoading: false,
  isBuffering: false,
  isBottomSheetVisible: false,

  setAvailableStreams: (streams) => set({ availableStreams: streams }),
  setIsLoadingStreams: (loading) => set({ isLoadingStreams: loading }),
  setCurrentStream: (stream) => set({ currentStream: stream }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsBuffering: (buffering) => set({ isBuffering: buffering }),
  setIsBottomSheetVisible: (visible) => set({ isBottomSheetVisible: visible }),

  fetchAvailableStreams: async () => {
    try {
      set({ isLoadingStreams: true });
      const response = await getDepartmentAudioStreams();
      set({ availableStreams: response.Data || [] });

      logger.debug({
        message: 'Audio streams fetched successfully',
        context: { count: response.Data?.length || 0 },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to fetch audio streams',
        context: { error },
      });
      set({ availableStreams: [] });
    } finally {
      set({ isLoadingStreams: false });
    }
  },

  playStream: async (stream: DepartmentAudioResultStreamData) => {
    try {
      const { soundObject: currentSound, stopStream } = get();

      // Stop current stream if playing
      if (currentSound) {
        await stopStream();
      }

      set({ isLoading: true, isBuffering: true });

      logger.debug({
        message: 'Starting audio stream',
        context: { streamName: stream.Name, streamUrl: stream.Url },
      });

      // Configure audio mode for streaming. `doNotMix` is required for the OS to
      // associate lock screen controls with this player (see setActiveForLockScreen
      // below), which in turn is what keeps Android background playback alive past
      // the ~3 minute foreground-service limit.
      await setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldRouteThroughEarpiece: false,
      });

      // Create new player
      const sound = createAudioPlayer({ uri: stream.Url }, { updateInterval: 1000 });
      sound.loop = false;
      sound.muted = false;
      sound.volume = 1.0;

      statusSubscription = sound.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (status.error) {
          // Handle error state
          logger.error({
            message: 'Audio playback error',
            context: { error: status.error, streamName: stream.Name },
          });

          // The store is about to drop its reference to this player, so stopStream()
          // could no longer reach it. Tear down the exact player that failed here.
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }

          if (statusSubscription) {
            statusSubscription.remove();
            statusSubscription = null;
          }

          try {
            try {
              sound.clearLockScreenControls();
            } finally {
              sound.remove();
            }
          } catch (disposeError) {
            logger.error({
              message: 'Failed to release failed audio stream player',
              context: { error: disposeError, streamName: stream.Name },
            });
          }

          set({
            soundObject: null,
            currentStream: null,
            isPlaying: false,
            isLoading: false,
            isBuffering: false,
          });
          return;
        }

        const { isPlaying, isBuffering } = get();

        if (status.playing !== isPlaying) {
          set({ isPlaying: status.playing });
        }

        if (status.isBuffering !== isBuffering) {
          set({ isBuffering: status.isBuffering });
        }

        // Handle stream ended scenarios
        if (status.didJustFinish) {
          logger.info({
            message: 'Audio stream finished',
            context: { streamName: stream.Name },
          });

          // For live streams, try to reconnect
          const { currentStream } = get();
          if (currentStream?.Id === stream.Id) {
            if (reconnectTimer) {
              clearTimeout(reconnectTimer);
            }
            reconnectTimer = setTimeout(async () => {
              reconnectTimer = null;
              try {
                await sound.seekTo(0);
                sound.play();
              } catch (replayError) {
                logger.error({
                  message: 'Failed to restart audio stream',
                  context: { error: replayError, streamName: stream.Name },
                });
              }
            }, 1000);
          }
        }
      });

      // Sustained background playback requires the player to own the lock screen
      // controls. Failing to claim them must not stop the stream from starting.
      try {
        sound.setActiveForLockScreen(true, { title: stream.Name });
      } catch (lockScreenError) {
        logger.warn({
          message: 'Failed to activate lock screen controls for audio stream',
          context: { error: lockScreenError, streamName: stream.Name },
        });
      }

      // Start playing
      sound.play();

      logger.info({
        message: 'Audio stream started successfully',
        context: { streamName: stream.Name },
      });

      set({
        soundObject: sound,
        currentStream: stream,
        isPlaying: true,
        isLoading: false,
        isBuffering: false,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to play audio stream',
        context: { error, streamName: stream.Name },
      });

      set({
        soundObject: null,
        currentStream: null,
        isPlaying: false,
        isLoading: false,
        isBuffering: false,
      });
    }
  },

  stopStream: async () => {
    const { soundObject, currentStream } = get();

    try {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (statusSubscription) {
        statusSubscription.remove();
        statusSubscription = null;
      }

      if (soundObject) {
        try {
          soundObject.pause();
          soundObject.clearLockScreenControls();
        } finally {
          // The player must be released even if pausing or releasing the lock
          // screen session throws, otherwise it keeps playing with no handle to it.
          soundObject.remove();
        }

        logger.info({
          message: 'Audio stream stopped',
          context: { streamName: currentStream?.Name },
        });
      }
    } catch (error) {
      logger.error({
        message: 'Failed to stop audio stream',
        context: { error },
      });
    } finally {
      set({
        soundObject: null,
        currentStream: null,
        isPlaying: false,
        isLoading: false,
        isBuffering: false,
      });
    }
  },

  cleanup: async () => {
    try {
      const { stopStream } = get();
      await stopStream();

      logger.debug({
        message: 'Audio stream store cleaned up',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to cleanup audio stream store',
        context: { error },
      });
    }
  },
}));
