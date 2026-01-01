import { BaseV4Request } from '../baseV4Request';
import { type FilterResultData } from '../personnel/filterResultData';

export class GetUnitFilterOptionsResult extends BaseV4Request {
  public Data: FilterResultData[] = [];
}
