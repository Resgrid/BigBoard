/**
 * Collapses concurrent calls into one in-flight execution.
 *
 * The dashboard mounts several widgets that render the same data set -- four personnel widgets,
 * three units widgets, two calls widgets -- and each one refreshes itself when SignalR reports a
 * change. Without this, a single status update fans out into one full refetch per widget, each
 * writing the same result into the same store. Wrapping the store action means every one of those
 * callers awaits the same request instead.
 *
 * Callers that arrive after the request settles start a fresh one, so this is deduplication, not
 * caching.
 */
export function singleFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null;

  return () => {
    if (inFlight) {
      return inFlight;
    }

    inFlight = (async () => {
      try {
        return await fn();
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  };
}
