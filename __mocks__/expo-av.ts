// Mock for expo-av
export const Audio = {
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  Sound: class MockSound {
    static createAsync = jest.fn().mockResolvedValue({
      sound: new this(),
      status: { isLoaded: true },
    });

    playAsync = jest.fn().mockResolvedValue({ status: { isPlaying: true } });
    stopAsync = jest.fn().mockResolvedValue({ status: { isPlaying: false } });
    unloadAsync = jest.fn().mockResolvedValue(undefined);
    setVolumeAsync = jest.fn().mockResolvedValue(undefined);
  },
  setIsEnabledAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({
    granted: true,
    canAskAgain: true,
    expires: 'never',
    status: 'granted',
  }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    granted: true,
    canAskAgain: true,
    expires: 'never',
    status: 'granted',
  }),
};

export const InterruptionModeIOS = {
  MixWithOthers: 0,
  DoNotMix: 1,
  DuckOthers: 2,
};

export const AVPlaybackSource = {};
