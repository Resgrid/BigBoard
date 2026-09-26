import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef } from 'react';

import { applyLiveLocations, type LiveLocationMap } from '@/lib/live-locations';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

/**
 * Keeps a map's REST pins in step with the realtime unit/personnel positions from the geolocation hub.
 *
 * - Each new push moves the matching unit (Type 1) or personnel (Type 3) pin in place. Pins are never
 *   added from a push: the REST data decides what this viewer may see.
 * - A push for a pin the map does not have is reported to the store, which turns bursts of those into
 *   one rate-limited background refetch.
 * - `applySnapshot` must wrap every REST result the map stores, so pushes that arrived while that
 *   request was in flight are not rolled back by the (possibly older) snapshot.
 *
 * The store is subscribed to directly rather than through a selector, so a push that moves none of this
 * map's pins does not re-render the map at all.
 */
export const useMapLiveLocations = (pins: MapMakerInfoData[], setPins: Dispatch<SetStateAction<MapMakerInfoData[]>>) => {
  const pinsRef = useRef(pins);
  // Until the first snapshot lands every push would look like an unknown pin.
  const hasSnapshotRef = useRef(false);

  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  useEffect(() => {
    // Positions that were already current when this map mounted are older than the REST snapshot it is
    // about to load, so they start out as "seen".
    let seen: LiveLocationMap = useSignalRStore.getState().liveLocations;

    return useSignalRStore.subscribe((state) => {
      const liveLocations = state.liveLocations;
      if (!liveLocations || liveLocations === seen) {
        return;
      }

      const previous = seen;
      seen = liveLocations;

      // Only the entries that changed since the last notification. Re-applying older positions here
      // would undo a REST snapshot that is newer than them.
      const changed: LiveLocationMap = {};
      let hasChanges = false;
      for (const [pinId, location] of Object.entries(liveLocations)) {
        if (previous?.[pinId] !== location) {
          changed[pinId] = location;
          hasChanges = true;
        }
      }

      if (!hasChanges) {
        return;
      }

      // applyLiveLocations returns the same array when nothing moved, so React bails out of the render.
      setPins((current) => applyLiveLocations(current, changed).pins);

      if (hasSnapshotRef.current) {
        const { unknownPinIds } = applyLiveLocations(pinsRef.current, changed);
        if (unknownPinIds.length > 0) {
          state.reportUnknownLivePins(unknownPinIds);
        }
      }
    });
  }, [setPins]);

  /**
   * Returns the pins to store for a fresh REST snapshot: `markers` with any realtime position received
   * at or after `fetchStartedAt` re-applied on top. Without `fetchStartedAt` the snapshot is used as is.
   */
  const applySnapshot = useCallback((markers: MapMakerInfoData[], fetchStartedAt?: number): MapMakerInfoData[] => {
    hasSnapshotRef.current = true;

    if (fetchStartedAt === undefined) {
      return markers;
    }

    return applyLiveLocations(markers, useSignalRStore.getState().liveLocations, { receivedSince: fetchStartedAt }).pins;
  }, []);

  return { applySnapshot };
};
