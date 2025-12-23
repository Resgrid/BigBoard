import { BaseV4Request } from '../baseV4Request';
import { MessageResultData } from './messageResultData';

export class MessageResult extends BaseV4Request {
  public Data: MessageResultData = new MessageResultData();
}
