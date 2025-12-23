import { BaseV4Request } from '../baseV4Request';
import { MapDataAndMarkersData } from './getMapDataAndMarkersData';

export class GetMapDataAndMarkersResult extends BaseV4Request {
  public Data: MapDataAndMarkersData = new MapDataAndMarkersData();
}
