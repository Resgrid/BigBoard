import { BaseV4Request } from '../baseV4Request';
import { type CallProtocolsResultData } from './callProtocolsResultData';

export class CallProtocolsResult extends BaseV4Request {
  public Data: CallProtocolsResultData[] = [];
}
