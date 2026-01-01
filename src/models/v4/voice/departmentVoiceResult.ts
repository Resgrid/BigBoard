import { BaseV4Request } from '../baseV4Request';
import { DepartmentVoiceResultData } from './departmentVoiceResultData';

export class DepartmentVoiceResult extends BaseV4Request {
  public Data: DepartmentVoiceResultData = new DepartmentVoiceResultData();
}
