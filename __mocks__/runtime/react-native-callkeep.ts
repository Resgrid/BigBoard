// Runtime-compatible mock for react-native-callkeep on web/desktop platforms
// This is NOT a Jest mock - it provides functional no-op implementations for runtime use

const RNCallKeep = {
  // Setup and configuration
  setup: async (_options: unknown): Promise<void> => undefined,
  hasDefaultPhoneAccount: async (): Promise<boolean> => false,
  checkIfBusy: (): Promise<boolean> => Promise.resolve(false),
  checkSpeaker: (): Promise<boolean> => Promise.resolve(false),
  isConnectionServiceAvailable: async (): Promise<boolean> => false,

  // Call management
  startCall: async (_uuid: string, _handle: string, _contactIdentifier?: string, _handleType?: string, _hasVideo?: boolean): Promise<void> => undefined,
  answerIncomingCall: (_uuid: string): void => {},
  endCall: (_uuid: string): void => {},
  endAllCalls: (): void => {},
  rejectCall: (_uuid: string): void => {},

  // Call state updates
  reportConnectingOutgoingCallWithUUID: (_uuid: string): void => {},
  reportConnectedOutgoingCallWithUUID: (_uuid: string): void => {},
  reportEndCallWithUUID: (_uuid: string, _reason: number): void => {},
  setCurrentCallActive: (_uuid: string): void => {},
  setOnHold: (_uuid: string, _hold: boolean): void => {},
  setMutedCall: (_uuid: string, _muted: boolean): void => {},

  // Incoming calls
  displayIncomingCall: async (_uuid: string, _handle: string, _localizedCallerName?: string, _handleType?: string, _hasVideo?: boolean): Promise<void> => undefined,

  // Audio
  setAudioRoute: async (_uuid: string, _inputName: string): Promise<void> => undefined,
  toggleAudioRouteSpeaker: (_uuid: string, _routeSpeaker: boolean): void => {},

  // DTMF
  sendDTMF: (_uuid: string, _key: string): void => {},

  // UI
  backToForeground: (): void => {},
  updateDisplay: (_uuid: string, _displayName: string, _handle: string): void => {},

  // Event listeners
  addEventListener: (_type: string, _handler: (...args: unknown[]) => void): void => {},
  removeEventListener: (_type: string): void => {},

  // Permissions (iOS only)
  hasPhoneAccount: async (): Promise<boolean> => false,
  supportConnectionService: (): boolean => false,
  registerPhoneAccount: (): void => {},
  registerAndroidEvents: (): void => {},

  // Utility
  getActiveCallUUID: (): string | null => null,
  canMakeMultipleCalls: (_allow: boolean): void => {},
};

// Constants
export const CONSTANTS = {
  END_CALL_REASONS: {
    FAILED: 1,
    REMOTE_ENDED: 2,
    UNANSWERED: 3,
    ANSWERED_ELSEWHERE: 4,
    DECLINED_ELSEWHERE: 5,
    MISSED: 6,
  },
} as const;

export const AudioSessionCategoryOption = {
  mixWithOthers: 0x1,
  duckOthers: 0x2,
  interruptSpokenAudioAndMixWithOthers: 0x11,
  allowBluetooth: 0x4,
  allowBluetoothA2DP: 0x20,
  allowAirPlay: 0x40,
  defaultToSpeaker: 0x8,
} as const;

export const AudioSessionMode = {
  default: 'AVAudioSessionModeDefault',
  gameChat: 'AVAudioSessionModeGameChat',
  measurement: 'AVAudioSessionModeMeasurement',
  moviePlayback: 'AVAudioSessionModeMoviePlayback',
  spokenAudio: 'AVAudioSessionModeSpokenAudio',
  videoChat: 'AVAudioSessionModeVideoChat',
  videoRecording: 'AVAudioSessionModeVideoRecording',
  voiceChat: 'AVAudioSessionModeVoiceChat',
  voicePrompt: 'AVAudioSessionModeVoicePrompt',
} as const;

export default RNCallKeep;
