import { BaseV4Request } from '../baseV4Request';
import { GetCurrentStatusResultData } from './getCurrentStatusResultData';

export class GetCurrentStatusResult extends BaseV4Request {
  public Data: GetCurrentStatusResultData = new GetCurrentStatusResultData();
}
