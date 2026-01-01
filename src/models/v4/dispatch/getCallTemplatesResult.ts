import { BaseV4Request } from '../baseV4Request';
import { type GetCallTemplatesResultData } from './getCallTemplatesResultData';

export class GetCallTemplatesResult extends BaseV4Request {
  public Data: GetCallTemplatesResultData[] = [];
}
