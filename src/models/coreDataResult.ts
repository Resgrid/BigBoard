import { DepartmentRightsResult } from './departmentRightsResult';
import { PersonnelInfo } from './personnelInfo';
import { GroupInfo } from './groupInfo';
import { UnitInfo } from './unitInfo';
import { RoleInfo } from './roleInfo';
import { StatusesInfo } from './statusesInfo';

export class CoreDataResult  {
    public Rights: DepartmentRightsResult;
    public Personnel: PersonnelInfo[];
    public Groups: GroupInfo[];
    public Units: UnitInfo[];
    public Roles: RoleInfo[];
    public Statuses: StatusesInfo[];
}