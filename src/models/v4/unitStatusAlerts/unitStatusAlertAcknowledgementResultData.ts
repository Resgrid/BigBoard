/** Matches UnitStatusAlertLevels on the server. */
export enum UnitStatusAlertAcknowledgedLevel {
  Warn = 1,
  Alert = 2,
}

/** Matches UnitStatusAlertAcknowledgementModes on the server. */
export enum UnitStatusAlertAcknowledgementMode {
  /** Seen: the unit stays highlighted, marked with who saw it and any note. */
  Acknowledged = 0,
  /** Moved out of the way until MutedUntilUtc, or until the unit changes status when that is null. */
  Muted = 1,
}

/**
 * A dispatcher's acknowledgement of a unit that has sat in a status past its timer. It covers one status
 * episode only (UnitStateId), and only up to the level that was acknowledged.
 */
export class UnitStatusAlertAcknowledgementResultData {
  public UnitStatusAlertAcknowledgementId: string = '';
  public UnitId: string = '';
  /** The status record this covers. Compare it with the unit's CurrentUnitStateId. */
  public UnitStateId: number = 0;
  public Level: UnitStatusAlertAcknowledgedLevel = UnitStatusAlertAcknowledgedLevel.Warn;
  public Mode: UnitStatusAlertAcknowledgementMode = UnitStatusAlertAcknowledgementMode.Acknowledged;
  public MutedUntilUtc: string | null = null;
  public Note: string | null = null;
  public AcknowledgedByUserId: string = '';
  public AcknowledgedByName: string | null = null;
  public AcknowledgedOnUtc: string = '';
  public ClearedOnUtc: string | null = null;
}
