import { type UnitRoleData } from './unitRoleData';

export class UnitInfoResultData {
  public UnitId: string = '';
  public DepartmentId: string = '';
  public Name: string = '';
  public Type: string = '';
  public TypeId: number = 0;
  public CustomStatusSetId: string = '';
  public GroupId: string = '';
  public GroupName: string = '';
  public Vin: string = '';
  public PlateNumber: string = '';
  public FourWheelDrive: boolean = false;
  public SpecialPermit: boolean = false;
  public CurrentDestinationId: string = '';
  public CurrentDestinationName: string = '';
  public CurrentStatusId: string = '';
  public CurrentStatus: string = '';
  /** CSS hex colour for the current status, supplied by the API ("#5CB85C"). */
  public CurrentStatusColor: string = '';
  /**
   * Canonical meaning of the unit's current status — see ActionBaseTypes on the server. Departments
   * name and colour statuses freely, so this is the only field that answers "is this unit available
   * / responding / on scene". Null when the status has no base type assigned.
   *
   * There used to be a `State` getter here returning `TypeId`, with a comment claiming TypeId
   * encoded the status. It does not — TypeId is the *unit type* — and a class getter never survives
   * JSON deserialization anyway, so every consumer read `undefined`. That is why the Unit Summary
   * widget always showed zero.
   */
  public CurrentStatusBaseType: number | null = null;
  public CurrentStatusTimestampUtc: string = '';
  public Latitude: string = '';
  public Longitude: string = '';
  public Note: string = '';
  public Roles: UnitRoleData[] = [];
}
