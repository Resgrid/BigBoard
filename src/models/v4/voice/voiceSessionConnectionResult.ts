import { BaseV4Request } from '../baseV4Request';
import { VoiceSessionConnectionResultData } from './voiceSessionConnectionResultData';

export class VoiceSessionConnectionResult extends BaseV4Request {
  public Data: VoiceSessionConnectionResultData = new VoiceSessionConnectionResultData();
}
