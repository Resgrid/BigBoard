import { CallPriorityResultData } from '../callPriorities/callPriorityResultData';
import { type CallProtocolsResultData } from '../callProtocols/callProtocolsResultData';
import { type DispatchedEventResultData } from './dispatchedEventResultData';

export class CallExtraDataResultData {
  public CallFormData: string = '';
  public Activity: DispatchedEventResultData[] = [];
  public Dispatches: DispatchedEventResultData[] = [];
  public Priority: CallPriorityResultData = new CallPriorityResultData();
  public Protocols: CallProtocolsResultData[] = [];
}
