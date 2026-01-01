import { BaseV4Request } from '../baseV4Request';
import { PersonnelInfoResultData } from './personnelInfoResultData';

export class PersonnelInfoResult extends BaseV4Request {
  public Data: PersonnelInfoResultData = new PersonnelInfoResultData();
}
