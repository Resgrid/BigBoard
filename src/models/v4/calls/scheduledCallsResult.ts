import { BaseV4Request } from '../baseV4Request';
import { type CallResultData } from './callResultData';

export class ScheduledCallsResult extends BaseV4Request {
  public Data: CallResultData[] = [];
}
