export class CallPriorityResultData {
  public Id: number = 0; // Call Priority Id
  public DepartmentId: number = 0; // Department Id for the Call
  public Name: string = ''; // Name of the Priority
  public Color: string = ''; // Color for the Priority
  public Sort: number = 0; // Sort
  public IsDeleted: boolean = false;
  public IsDefault: boolean = false;
  public Tone: number = 0;
  /** The standard priority this one means (CallPriorityBaseTypes: 0 Low .. 3 Emergency); -1 when unset, undefined from older servers. */
  public BaseType?: number | null;
}
