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
  public CurrentStatusColor: string = '';
  public CurrentStatusTimestampUtc: string = '';
  public Latitude: string = '';
  public Longitude: string = '';
  public Note: string = '';
  public Roles: UnitRoleData[] = [];

  // State property based on TypeId (0=Available, 2=Responding, 3=EnRoute, 4=OnScene)
  public get State(): number {
    return this.TypeId;
  }
}
