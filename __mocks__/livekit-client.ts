export const Room = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
  off: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  localParticipant: {
    setMicrophoneEnabled: jest.fn().mockResolvedValue(undefined),
  },
  participants: new Map(),
  state: 'disconnected',
  name: 'test-room',
}));

export const RoomEvent = {
  Connected: 'connected',
  Disconnected: 'disconnected',
  ParticipantConnected: 'participantConnected',
  ParticipantDisconnected: 'participantDisconnected',
  TrackSubscribed: 'trackSubscribed',
  TrackUnsubscribed: 'trackUnsubscribed',
  LocalTrackPublished: 'localTrackPublished',
  LocalTrackUnpublished: 'localTrackUnpublished',
};

export const ConnectionState = {
  Connected: 'connected',
  Connecting: 'connecting',
  Disconnected: 'disconnected',
  Reconnecting: 'reconnecting',
};

export const RemoteParticipant = jest.fn();
export const LocalParticipant = jest.fn();
export const Track = jest.fn();
export const RemoteTrack = jest.fn();
export const LocalTrack = jest.fn();
export const AudioTrack = jest.fn();
export const VideoTrack = jest.fn();
