import { BaseV4Request } from '../baseV4Request';
import { GetSetUnitStateResultData } from './getSetUnitStateResultData';

export class GetSetUnitStateResult extends BaseV4Request {
  public Data: GetSetUnitStateResultData = new GetSetUnitStateResultData();
}
