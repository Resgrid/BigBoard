import { BaseV4Request } from '../baseV4Request';
import { type ShiftDaysResultData } from './shiftDayResultData';

export class ShiftDaysResult extends BaseV4Request {
  public Data: ShiftDaysResultData[] = [];
}
