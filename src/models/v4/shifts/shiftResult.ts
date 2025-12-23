import { BaseV4Request } from '../baseV4Request';
import { ShiftResultData } from './shiftResultData';

export class ShiftResult extends BaseV4Request {
  public Data: ShiftResultData = new ShiftResultData();
}
