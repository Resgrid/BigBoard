import { DispatchedEventResult } from './dispatchedEventResult';
import { CallPriorityResult } from './callPriorityResult';

export class CallDataResult  {
    public Activity: DispatchedEventResult[];
    public Dispatches: DispatchedEventResult[];
    public Priority: CallPriorityResult;
}