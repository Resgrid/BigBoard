import { BaseV4Request } from '../baseV4Request';
import { PersonnelLocationResultData } from './personnelLocationResultData';

export class PersonnelLocationResult extends BaseV4Request {
  public Data: PersonnelLocationResultData = new PersonnelLocationResultData();
}
