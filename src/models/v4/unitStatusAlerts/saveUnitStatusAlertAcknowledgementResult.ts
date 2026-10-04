import { BaseV4Request } from '../baseV4Request';
import { type UnitStatusAlertAcknowledgementResultData } from './unitStatusAlertAcknowledgementResultData';

/** Error codes the server returns when an acknowledgement is refused. */
export type UnitStatusAlertAcknowledgementError =
  | 'unit_alert_not_found'
  | 'unit_alert_status_changed'
  | 'unit_alert_not_overdue'
  | 'unit_alert_conflict'
  | 'unit_alert_invalid_mode'
  | 'unit_alert_invalid_level'
  | 'unit_alert_note_too_long';

export class SaveUnitStatusAlertAcknowledgementResult extends BaseV4Request {
  /** Null on success. On unit_alert_conflict, Data holds the acknowledgement that got there first. */
  public Error: UnitStatusAlertAcknowledgementError | null = null;
  public Data: UnitStatusAlertAcknowledgementResultData | null = null;
}
