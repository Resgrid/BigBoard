import { BaseV4Request } from '../baseV4Request';
import { type GroupResultData } from './groupsResultData';

export class GroupsResult extends BaseV4Request {
  public Data: GroupResultData[] = [];
}
