import { BaseV4Request } from '../baseV4Request';
import { type CallNoteTemplateResultData } from './callNoteTemplateResultData';

export class CallNoteTemplatesResult extends BaseV4Request {
  public Data: CallNoteTemplateResultData[] = [];
}
