import { GroupRightResult } from './groupRightResult';

export class DepartmentRightsResult {
    public Adm: boolean = false;    // Is Department Admin
    public VPii: boolean = false;    // Can View PII
    public CCls: boolean = false;   // Can Create Calls
    public ANot: boolean = false;   // Can Add a Note
    public Grps: GroupRightResult[]; // Group Rights
}