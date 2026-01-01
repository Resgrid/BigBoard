import { BaseV4Request } from '../baseV4Request';
import { type UnitResultData } from './unitResultData';

export class UnitsResult extends BaseV4Request {
  public Data: UnitResultData[] = [];
}
