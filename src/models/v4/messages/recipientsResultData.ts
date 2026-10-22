export class RecipientsResultData {
  public Id: string = '';
  public Type: string = '';
  public Name: string = '';
  public Selected: boolean = false;
  /** Unit rows (Type "Unit") only: department-uploaded type icon URL; role rows: the role's uploaded icon. Null/undefined otherwise or from older servers. */
  public TypeIconUrl?: string | null;
  /** Unit rows (Type "Unit") only: built-in type icon name (lowercase `MAP_ICONS` key). */
  public TypeMapIcon?: string | null;
}
