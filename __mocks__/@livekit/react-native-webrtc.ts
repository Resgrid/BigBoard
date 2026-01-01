import React from 'react';

// Mock RTCView component for web
export const RTCView = jest.fn((props: any) => {
  return React.createElement('div', {
    ...props,
    'data-testid': 'rtc-view',
    style: { width: '100%', height: '100%', backgroundColor: '#000', ...props.style },
  });
});

// Mock MediaStream for web
export class MediaStream {
  id: string;
  active: boolean = true;

  constructor() {
    this.id = `mock-stream-${Math.random()}`;
  }

  getTracks() {
    return [];
  }

  getAudioTracks() {
    return [];
  }

  getVideoTracks() {
    return [];
  }

  addTrack(track: any) {}

  removeTrack(track: any) {}

  clone() {
    return new MediaStream();
  }
}

// Mock MediaStreamTrack
export class MediaStreamTrack {
  id: string;
  kind: string;
  enabled: boolean = true;
  readyState: string = 'live';

  constructor(kind: string = 'audio') {
    this.id = `mock-track-${Math.random()}`;
    this.kind = kind;
  }

  stop() {}

  clone() {
    return new MediaStreamTrack(this.kind);
  }
}

// Mock RTCPeerConnection
export class RTCPeerConnection {
  localDescription: any = null;
  remoteDescription: any = null;
  signalingState: string = 'stable';
  iceConnectionState: string = 'new';
  iceGatheringState: string = 'new';

  createOffer(options?: any): Promise<any> {
    return Promise.resolve({ type: 'offer', sdp: 'mock-sdp' });
  }

  createAnswer(options?: any): Promise<any> {
    return Promise.resolve({ type: 'answer', sdp: 'mock-sdp' });
  }

  setLocalDescription(description: any): Promise<void> {
    this.localDescription = description;
    return Promise.resolve();
  }

  setRemoteDescription(description: any): Promise<void> {
    this.remoteDescription = description;
    return Promise.resolve();
  }

  addIceCandidate(candidate: any): Promise<void> {
    return Promise.resolve();
  }

  addTrack(track: any, stream: any) {
    return {};
  }

  removeTrack(sender: any) {}

  getSenders() {
    return [];
  }

  getReceivers() {
    return [];
  }

  getTransceivers() {
    return [];
  }

  addTransceiver(trackOrKind: any, init?: any) {
    return {};
  }

  close() {}

  addEventListener(event: string, handler: any) {}

  removeEventListener(event: string, handler: any) {}
}

// Mock RTCAudioSession
export const RTCAudioSession = {
  setCategory: jest.fn().mockResolvedValue(undefined),
  setCategoryAndMode: jest.fn().mockResolvedValue(undefined),
  setMode: jest.fn().mockResolvedValue(undefined),
  setActive: jest.fn().mockResolvedValue(undefined),
  overrideOutputAudioPort: jest.fn().mockResolvedValue(undefined),
};

// Mock mediaDevices
export const mediaDevices = {
  enumerateDevices: jest.fn().mockResolvedValue([]),
  getUserMedia: jest.fn().mockResolvedValue(new MediaStream()),
  getDisplayMedia: jest.fn().mockResolvedValue(new MediaStream()),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock registerGlobals - this is critical for web compatibility
export const registerGlobals = jest.fn(() => {
  // On web, we don't need to register WebRTC globals
  if (typeof window !== 'undefined') {
    // Web platform - use browser's native WebRTC
    return;
  }
});

export default RTCView;
