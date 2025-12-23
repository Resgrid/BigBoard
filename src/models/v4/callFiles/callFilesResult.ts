import { BaseV4Request } from '../baseV4Request';
import { type CallFileResultData } from './callFileResultData';

export class CallFilesResult extends BaseV4Request {
  public Data: CallFileResultData[] = [];
}
