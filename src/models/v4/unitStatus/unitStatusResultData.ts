export class UnitStatusResultData {
  public Name: string = '';
  public Type: string = '';
  public State: string = '';
  public StateCss: string = '';
  public StateStyle: string = '';
  public Timestamp: string = '';
  public DestinationId: string = '';
  public Note: string = '';
  public Latitude: string = '';
  public Longitude: string = '';
  public GroupName: string = '';
  public GroupId: string = '';
  public Eta: string = '';
  public UnitId: string = '';
  /** The department's uploaded icon for the unit's type (absolute URL, anonymous GET, 128x128 PNG); null when none was uploaded or from older servers. */
  public TypeIconUrl?: string | null = null;
  /** The built-in map icon the unit's type picked (lowercase MAP_ICONS key, e.g. "ambulance"); null when none or from older servers. */
  public TypeMapIcon?: string | null = null;
}
