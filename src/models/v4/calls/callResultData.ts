export class CallResultData {
  public CallId: string = '';
  public Priority: number = 0;
  public Name: string = '';
  public Nature: string = '';
  public Note: string = '';
  public Address: string = '';
  public Geolocation: string = '';
  public LoggedOn: string = '';
  public State: string = '';
  public Number: string = '';
  public NotesCount: number = 0;
  public AudioCount: number = 0;
  public ImgagesCount: number = 0;
  public FileCount: number = 0;
  public What3Words: string = '';
  public ContactName: string = '';
  public ContactInfo: string = '';
  public ReferenceId: string = '';
  public ExternalId: string = '';
  public IncidentId: string = '';
  public AudioFileId: string = '';
  public Type: string = 'No Type';
  /** Id of the department call type the call was logged with (matches CallTypeResultData.Id); null when none, undefined from older servers. */
  public TypeId?: string | null;
  /** The department's uploaded icon for the call's type (absolute URL, anonymous GET, 128x128 PNG); null when none was uploaded or from older servers. */
  public TypeIconUrl?: string | null = null;
  /** The built-in map icon the call's type picked (lowercase MAP_ICONS key, e.g. "fire"); null when none or from older servers. */
  public TypeMapIcon?: string | null = null;
  public LoggedOnUtc: string = '';
  public DispatchedOn: string = '';
  public DispatchedOnUtc: string = '';
  public Latitude: string = '';
  public Longitude: string = '';
}
