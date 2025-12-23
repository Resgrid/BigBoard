import { BaseV4Request } from '../baseV4Request';
import { type CallPriorityResultData } from './callPriorityResultData';

export class CallPrioritiesResult extends BaseV4Request {
  public Data: CallPriorityResultData[] = [];
}
