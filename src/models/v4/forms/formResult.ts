import { BaseV4Request } from '../baseV4Request';
import { FormResultData } from './formResultData';

export class FormResult extends BaseV4Request {
  public Data: FormResultData = new FormResultData();
}
