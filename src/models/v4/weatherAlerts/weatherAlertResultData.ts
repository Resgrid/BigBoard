// Mirrors Resgrid Core's v4 WeatherAlertResultData (Web/Resgrid.Web.Services/Models/v4/WeatherAlerts).
// Enum-valued fields are ints (see WeatherAlertSeverity/Category/Urgency/Certainty/Status in Core).
export class WeatherAlertResultData {
  public WeatherAlertId: string = '';
  public DepartmentId: number = 0;
  public WeatherAlertSourceId: string = '';
  public ExternalId: string = '';
  public Sender: string = '';
  public Event: string = '';
  public AlertCategory: number = 4; // Other
  public Severity: number = 4; // Unknown
  public Urgency: number = 4; // Unknown
  public Certainty: number = 4; // Unknown
  public Status: number = 0; // Active
  public Headline: string = '';
  public Description: string = '';
  public Instruction: string = '';
  public AreaDescription: string = '';
  public Polygon: string = '';
  public Geocodes: string = '';
  public CenterGeoLocation: string = '';
  // Department-local display strings (despite the Utc names) — render verbatim only.
  public OnsetUtc: string = '';
  public ExpiresUtc: string = '';
  public EffectiveUtc: string = '';
  public SentUtc: string = '';
  public FirstSeenUtc: string = '';
  public LastUpdatedUtc: string = '';
  // Real UTC instants with explicit "Z" — use these for any date math. Empty on older servers.
  public EffectiveOnUtc?: string = '';
  public OnsetOnUtc?: string = '';
  public ExpiresOnUtc?: string = '';
  public SentOnUtc?: string = '';
  public ReferencesExternalId: string = '';
  public NotificationSent: boolean = false;
  public SystemMessageId?: number;
}
