import { BaseV4Request } from '../baseV4Request';
import { UnitStatusResultData } from './unitStatusResultData';

export class UnitStatusResult extends BaseV4Request {
  public Data: UnitStatusResultData = new UnitStatusResultData();
}
