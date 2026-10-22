export class DispatchedEventResultData {
  public Id: string = '';
  public Timestamp: string = '';
  public Type: string = '';
  public Name: string = '';
  public GroupId: string = '';
  public Group: string = '';
  public Note: string = '';
  public StatusId: number = 0;
  public Location: string = '';

  public StatusText: string = '';
  public StatusColor: string = '';

  /** Unit rows only: department-uploaded type icon URL; null/undefined otherwise or from older servers. */
  public TypeIconUrl?: string | null;
  /** Unit rows only: built-in type icon name (lowercase `MAP_ICONS` key). */
  public TypeMapIcon?: string | null;
}
