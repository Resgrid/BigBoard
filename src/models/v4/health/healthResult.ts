import { BaseV4Request } from '../baseV4Request';
import { HealthResultData } from './healthResultData';

export class HealthResult extends BaseV4Request {
  public Data: HealthResultData = new HealthResultData();
}
