import { BaseV4Request } from '../baseV4Request';
import { GetMapLayersResultData } from './getMapLayersResultData';

export class GetMapLayersResult extends BaseV4Request {
  public Data: GetMapLayersResultData = new GetMapLayersResultData();
}
