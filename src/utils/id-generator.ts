/**
 * Generate a unique ID for events
 * Uses timestamp and random string for uniqueness
 */
export const generateEventId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomString}`;
};
