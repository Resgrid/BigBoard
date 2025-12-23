export class CalendarItemResultData {
  public CalendarItemId: string = '';
  public Title: string = '';
  public Start: string = '';
  public StartUtc: string = '';
  public End: string = '';
  public EndUtc: string = '';
  public StartTimezone: string = '';
  public EndTimezone: string = '';
  public Description: string = '';
  public RecurrenceId: string = '';
  public RecurrenceRule: string = '';
  public RecurrenceException: string = '';
  public ItemType: number = 0;
  public IsAllDay: boolean = false;
  public Location: string = '';
  public SignupType: number = 0;
  public Reminder: number = 0;
  public LockEditing: boolean = false;
  public Entities: string = '';
  public RequiredAttendes: string = '';
  public OptionalAttendes: string = '';
  public IsAdminOrCreator: boolean = false;
  public CreatorUserId: string = '';
  public Attending: boolean = false;
  public TypeName: string = '';
  public TypeColor: string = '';

  public Attendees: CalendarItemResultAttendeeData[] = [];
}

export class CalendarItemResultAttendeeData {
  public CalendarItemId: string = '';
  public UserId: string = '';
  public Name: string = '';
  public GroupName: string = '';
  public AttendeeType: number = 0;
  public Timestamp: string = '';
  public Note: string = '';
}
