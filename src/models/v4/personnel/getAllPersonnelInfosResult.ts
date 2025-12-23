import { BaseV4Request } from '../baseV4Request';
import { type PersonnelInfoResultData } from './personnelInfoResultData';

export class GetAllPersonnelInfosResult extends BaseV4Request {
  public Data: PersonnelInfoResultData[] = [];
}
