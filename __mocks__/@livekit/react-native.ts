import React from 'react';

// Mock registerGlobals for web platform
export const registerGlobals = jest.fn();

// Mock VideoView component for web
export const VideoView = jest.fn((props: any) => {
  return React.createElement('div', {
    ...props,
    'data-testid': 'video-view',
    style: { width: '100%', height: '100%', backgroundColor: '#000', ...props.style },
  });
});

// Mock AudioSession for web
export const AudioSession = {
  startAudioSession: jest.fn().mockResolvedValue(undefined),
  stopAudioSession: jest.fn().mockResolvedValue(undefined),
  configureAudio: jest.fn().mockResolvedValue(undefined),
};

// Re-export everything from livekit-client mock
export * from 'livekit-client';
