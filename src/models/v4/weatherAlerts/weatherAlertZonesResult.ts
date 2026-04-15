import { BaseV4Request } from '../baseV4Request';
import { type WeatherAlertZoneResultData } from './weatherAlertZoneResultData';

export class WeatherAlertZonesResult extends BaseV4Request {
  public Data: WeatherAlertZoneResultData[] = [];
}
