import { BaseV4Request } from '../baseV4Request';
import { type FilterResultData } from './filterResultData';

export class GetPersonnelFilterOptionsResult extends BaseV4Request {
  public Data: FilterResultData[] = [];
}
