import { BaseV4Request } from '../baseV4Request';
import { type UnitTypeStatusResultData } from './unitTypeStatusResultData';

export class UnitTypeStatusesResult extends BaseV4Request {
  public Data: UnitTypeStatusResultData[] = [];
}
