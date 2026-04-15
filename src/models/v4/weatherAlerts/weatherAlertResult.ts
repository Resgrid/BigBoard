import { BaseV4Request } from '../baseV4Request';
import { WeatherAlertResultData } from './weatherAlertResultData';

export class WeatherAlertResult extends BaseV4Request {
  public Data: WeatherAlertResultData = new WeatherAlertResultData();
}
