import { type GetMapDataAndMarkersResult } from '@/models/v4/mapping/getMapDataAndMarkersResult';
import { type GetMapLayersResult } from '@/models/v4/mapping/getMapLayersResult';

import { createApiEndpoint } from '../common/client';

const getMapLayersApi = createApiEndpoint('/Mapping/GetMayLayers');

const getMapDataAndMarkersApi = createApiEndpoint('/Mapping/GetMapDataAndMarkers');

export const getMapDataAndMarkers = async (signal?: AbortSignal) => {
  const response = await getMapDataAndMarkersApi.get<GetMapDataAndMarkersResult>(undefined, signal);
  return response.data;
};

export const getMapLayers = async (type: number, signal?: AbortSignal) => {
  const response = await getMapLayersApi.get<GetMapLayersResult>(
    {
      type: encodeURIComponent(type),
    },
    signal
  );
  return response.data;
};
