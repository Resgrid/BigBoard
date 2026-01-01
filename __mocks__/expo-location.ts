export const LocationAccuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export const LocationActivityType = {
  Other: 1,
  AutomotiveNavigation: 2,
  Fitness: 3,
  OtherNavigation: 4,
  Airborne: 5,
};

export const requestForegroundPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
});

export const requestBackgroundPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
});

export const getCurrentPositionAsync = jest.fn().mockResolvedValue({
  coords: {
    latitude: 40.7128,
    longitude: -74.006,
    altitude: null,
    accuracy: 5,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
});

export const watchPositionAsync = jest.fn().mockImplementation((options, callback) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let hasTimedOut = false;

  // Use setTimeout for a one-shot callback to avoid timer leaks
  timeoutId = setTimeout(() => {
    hasTimedOut = true;
    timeoutId = null;
    callback({
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
        altitude: null,
        accuracy: 5,
        altitudeAccuracy: null,
        heading: 0,
        speed: null,
      },
      timestamp: Date.now(),
    });
  }, 100); // Shorter delay for faster tests

  return Promise.resolve({
    remove: () => {
      if (timeoutId && !hasTimedOut) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      // Safe no-op if timeout already fired
    },
  });
});

export const startLocationUpdatesAsync = jest.fn().mockResolvedValue(undefined);
export const stopLocationUpdatesAsync = jest.fn().mockResolvedValue(undefined);
export const hasStartedLocationUpdatesAsync = jest.fn().mockResolvedValue(false);
