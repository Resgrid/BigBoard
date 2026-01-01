import { type CallPriorityResultData } from '../callPriorities/callPriorityResultData';
import { type CallTypeResultData } from '../callTypes/callTypeResultData';
import { type CustomStatusResultData } from '../customStatuses/customStatusResultData';
import { type GroupResultData } from '../groups/groupsResultData';
import { type PersonnelInfoResultData } from '../personnel/personnelInfoResultData';
import { type RoleResultData } from '../roles/roleResultData';
import { type UnitRoleResultData } from '../unitRoles/unitRoleResultData';
import { type UnitResultData } from '../units/unitResultData';
import { type UnitStatusResultData } from '../unitStatus/unitStatusResultData';

export class NewCallFormResultData {
  public Personnel: PersonnelInfoResultData[] = [];
  public Groups: GroupResultData[] = [];
  public Units: UnitResultData[] = [];
  public Roles: RoleResultData[] = [];
  public Statuses: CustomStatusResultData[] = [];
  public UnitStatuses: UnitStatusResultData[] = [];
  public UnitRoles: UnitRoleResultData[] = [];
  public Priorities: CallPriorityResultData[] = [];
  public CallTypes: CallTypeResultData[] = [];
}
