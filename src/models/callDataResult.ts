import { DispatchedEventResult } from './dispatchedEventResult';

export class CallDataResult  {
    public Activity: DispatchedEventResult[];
    public Dispatches: DispatchedEventResult[];

    public hasGroupBeenDispatched(groupId: number): boolean {
        if (!this.Dispatches || this.Dispatches.length <= 0) {
            return false;
        }

        this.Dispatches.forEach(dispatch => {
            if (dispatch && dispatch.GroupId === groupId) {
                return true;
            }
        });

        return false;
    }
}