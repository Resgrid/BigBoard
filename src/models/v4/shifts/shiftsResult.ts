import { BaseV4Request } from '../baseV4Request';
import { type ShiftResultData } from './shiftResultData';

export class ShiftsResult extends BaseV4Request {
  public Data: ShiftResultData[] = [];
}
