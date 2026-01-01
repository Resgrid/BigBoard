import { BaseV4Request } from '../baseV4Request';
import { UnitLocationResultData } from './unitLocationResultData';

export class UnitLocationResult extends BaseV4Request {
  public Data: UnitLocationResultData = new UnitLocationResultData();
}
