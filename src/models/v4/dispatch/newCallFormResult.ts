import { BaseV4Request } from '../baseV4Request';
import { NewCallFormResultData } from './newCallFormResultData';

export class NewCallFormResult extends BaseV4Request {
  public Data: NewCallFormResultData = new NewCallFormResultData();
}
