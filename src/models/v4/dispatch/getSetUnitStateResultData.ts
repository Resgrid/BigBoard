import { type CallResultData } from '../calls/callResultData';
import { type CustomStatusResultData } from '../customStatuses/customStatusResultData';
import { type GroupResultData } from '../groups/groupsResultData';

export class GetSetUnitStateResultData {
  public UnitId: string = '';
  public UnitName: string = '';
  public Stations: GroupResultData[] = [];
  public Calls: CallResultData[] = [];
  public Statuses: CustomStatusResultData[] = [];
}
