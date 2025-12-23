import { BaseV4Request } from '../baseV4Request';
import { GetSystemConfigResultData } from './getSystemConfigResultData';

export class GetSystemConfigResult extends BaseV4Request {
  public Data: GetSystemConfigResultData = new GetSystemConfigResultData();
}
