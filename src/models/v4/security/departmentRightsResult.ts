import { BaseV4Request } from '../baseV4Request';
import { DepartmentRightsResultData } from './departmentRightsResultData';

export class DepartmentRightsResult extends BaseV4Request {
  public Data: DepartmentRightsResultData = new DepartmentRightsResultData();
}
