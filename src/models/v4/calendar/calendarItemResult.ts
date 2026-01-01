import { BaseV4Request } from '../baseV4Request';
import { CalendarItemResultData } from './calendarItemResultData';

export class CalendarItemResult extends BaseV4Request {
  public Data: CalendarItemResultData = new CalendarItemResultData();
}
