import { BaseV4Request } from '../baseV4Request';
import { type ContactResultData } from './contactResultData';

export class ContactResult extends BaseV4Request {
  public Data: ContactResultData = {} as ContactResultData;
}
