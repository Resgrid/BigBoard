import { BaseV4Request } from '../baseV4Request';
import { type UnitStatusAlertAcknowledgementResultData } from './unitStatusAlertAcknowledgementResultData';

export class GetUnitStatusAlertAcknowledgementsResult extends BaseV4Request {
  public Data: UnitStatusAlertAcknowledgementResultData[] = [];
}
