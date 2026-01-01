const mockMethods = {
  setup: jest.fn().mockResolvedValue(undefined),
  startCall: jest.fn().mockResolvedValue(undefined),
  reportConnectingOutgoingCallWithUUID: jest.fn().mockResolvedValue(undefined),
  reportConnectedOutgoingCallWithUUID: jest.fn().mockResolvedValue(undefined),
  endCall: jest.fn().mockResolvedValue(undefined),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  answerIncomingCall: jest.fn(),
  rejectCall: jest.fn(),
  setCurrentCallActive: jest.fn(),
  backToForeground: jest.fn(),
};

export default mockMethods;

export const AudioSessionCategoryOption = {
  allowAirPlay: 1,
  allowBluetooth: 2,
  allowBluetoothA2DP: 4,
  defaultToSpeaker: 8,
};

export const AudioSessionMode = {
  voiceChat: 1,
};

export const CONSTANTS = {};
