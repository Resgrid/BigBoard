import { BaseV4Request } from '../baseV4Request';
import { type UnitStatusResultData } from './unitStatusResultData';

export class UnitStatusesResult extends BaseV4Request {
  public Data: UnitStatusResultData[] = [];
}
