import { BaseV4Request } from '../baseV4Request';
import { type GetPersonnelForCallGridResultData } from './getPersonnelForCallGridResultData';

export class GetPersonnelForCallGridResult extends BaseV4Request {
  public Data: GetPersonnelForCallGridResultData[] = [];
}
