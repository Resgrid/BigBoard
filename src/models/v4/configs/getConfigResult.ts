import { BaseV4Request } from '../baseV4Request';
import { GetConfigResultData } from './getConfigResultData';

export class GetConfigResult extends BaseV4Request {
  public Data: GetConfigResultData = new GetConfigResultData();
}
