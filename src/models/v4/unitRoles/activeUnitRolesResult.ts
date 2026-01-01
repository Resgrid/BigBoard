import { BaseV4Request } from '../baseV4Request';
import { type ActiveUnitRoleResultData } from './activeUnitRoleResultData';

export class ActiveUnitRolesResult extends BaseV4Request {
  public Data: ActiveUnitRoleResultData[] = [];
}
