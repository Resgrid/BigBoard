import {
  CallPriorityResultData,
  CallResultData,
  CallTypeResultData,
  FormResultData,
  GetPersonnelForCallGridResultData,
  GetRolesForCallGridResultData,
  GroupResultData,
  UnitResultData,
  UnitStatusResultData,
  UnitTypeStatusResultData,
} from '@resgrid/ngx-resgridlib';
import { ActiveUnitRoleResultData } from '@resgrid/ngx-resgridlib/lib/models/v4/unitRoles/activeUnitRoleResultData';

export class AppPayload {
  public Units: UnitResultData[];
  public Calls: CallResultData[];
  public CallPriorties: CallPriorityResultData[];
  public CallTypes: CallTypeResultData[];
  public UnitStatuses: UnitTypeStatusResultData[];
  public UnitRoleAssignments: ActiveUnitRoleResultData[];
  public Groups: GroupResultData[];
}
