export class DepartmentRightsResultData {
  public DepartmentName: string = '';
  public DepartmentCode: string = '';
  public FullName: string = '';
  public EmailAddress: string = '';
  public DepartmentId: string = '';
  public IsAdmin: boolean = false; // Is Department Admin
  public CanViewPII: boolean = false; // Can View PII
  public CanCreateCalls: boolean = false; // Can Create Calls
  public CanAddNote: boolean = false; // Can Add a Note
  public CanCreateMessage: boolean = false; // Can Add a Message
  public Groups: GroupRightResultData[] = []; // Group Rights
}

export class GroupRightResultData {
  public GroupId: number = 0; // Group Id
  public IsGroupAdmin: boolean = false; // Is Group Admin
}
