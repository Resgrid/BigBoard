import { BaseV4Request } from '../baseV4Request';
import { type CalendarItemResultData } from './calendarItemResultData';

export class CalendarItemsResult extends BaseV4Request {
  public Data: CalendarItemResultData[] = [];
}
