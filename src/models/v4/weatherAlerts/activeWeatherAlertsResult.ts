import { BaseV4Request } from '../baseV4Request';
import { type WeatherAlertResultData } from './weatherAlertResultData';

export class ActiveWeatherAlertsResult extends BaseV4Request {
  public Data: WeatherAlertResultData[] = [];
}
