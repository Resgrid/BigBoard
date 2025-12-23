/**
 * Mock for expo-keep-awake on web platform
 * Keep awake functionality doesn't apply to web browsers
 */

export async function activateKeepAwakeAsync(tag?: string): Promise<void> {
  console.debug(`[Mock] activateKeepAwakeAsync called with tag: ${tag} (no-op on web)`);
  return Promise.resolve();
}

export function deactivateKeepAwake(tag?: string): void {
  console.debug(`[Mock] deactivateKeepAwake called with tag: ${tag} (no-op on web)`);
}

export function useKeepAwake(tag?: string, options?: { suppressDeactivateWarnings?: boolean }): void {
  console.debug(`[Mock] useKeepAwake hook called with tag: ${tag} (no-op on web)`);
}

export function activateKeepAwake(tag?: string): void {
  console.debug(`[Mock] activateKeepAwake called with tag: ${tag} (no-op on web)`);
}
