import { BaseV4Request } from '../baseV4Request';
import { GetCurrentStaffingResultData } from './getCurrentStaffingResultData';

export class GetCurrentStaffingResult extends BaseV4Request {
  public Data: GetCurrentStaffingResultData = new GetCurrentStaffingResultData();
}
