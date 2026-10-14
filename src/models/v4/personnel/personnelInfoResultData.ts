export class PersonnelInfoResultData {
  public UserId: string = '';
  public IdentificationNumber: string = '';
  public DepartmentId: string = '';
  public FirstName: string = '';
  public LastName: string = '';
  public EmailAddress: string = '';
  public MobilePhone: string = '';
  public GroupId: string = '';
  public GroupName: string = '';
  public StatusId: string = '';
  public Status: string = '';
  public StatusColor: string = '';
  /** What the status means (ActionBaseTypes, see lib/base-types); -1 when it has none, undefined from older servers. */
  public StatusBaseType?: number | null;
  public StatusTimestamp: string = '';
  public StatusDestinationId: string = '';
  public StatusDestinationName: string = '';
  /** What StatusDestinationId names (1 station, 2 call, 3 POI), when the status recorded it. */
  public StatusDestinationType?: number | null;
  public StaffingId: string = '';
  public Staffing: string = '';
  public StaffingColor: string = '';
  /** What the staffing level means (StaffingBaseTypes, see lib/base-types); -1 when it has none, undefined from older servers. */
  public StaffingBaseType?: number | null;
  public StaffingTimestamp: string = '';
  public Roles: string[] = [];
}
