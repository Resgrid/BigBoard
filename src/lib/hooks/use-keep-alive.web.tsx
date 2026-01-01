import React from 'react';

export const useKeepAlive = () => {
  // Keep awake is not supported on web, so we just return false and a no-op setter
  const isKeepAliveEnabled = false;

  const setKeepAliveEnabled = React.useCallback(async (enabled: boolean) => {
    console.warn('Keep awake is not supported on web platform');
  }, []);

  return { isKeepAliveEnabled, setKeepAliveEnabled } as const;
};

export const loadKeepAliveState = async () => {
  console.debug('Keep awake initialization skipped on web platform');
  return;
};
