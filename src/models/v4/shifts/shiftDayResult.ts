import { BaseV4Request } from '../baseV4Request';
import { ShiftDaysResultData } from './shiftDayResultData';

export class ShiftDayResult extends BaseV4Request {
  public Data: ShiftDaysResultData = new ShiftDaysResultData();
}
