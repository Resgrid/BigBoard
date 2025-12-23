import { BaseV4Request } from '../baseV4Request';
import { type RecipientsResultData } from './recipientsResultData';

export class GetRecipientsResult extends BaseV4Request {
  public Data: RecipientsResultData[] = [];
}
