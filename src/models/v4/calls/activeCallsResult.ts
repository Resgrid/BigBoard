import { BaseV4Request } from '../baseV4Request';
import { type CallResultData } from './callResultData';

export class ActiveCallsResult extends BaseV4Request {
  public Data: CallResultData[] = [];
}
