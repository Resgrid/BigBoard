import { BaseV4Request } from '../baseV4Request';
import { CanConnectToVoiceSessionData } from './canConnectToVoiceSessionData';

export class CanConnectToVoiceSessionResult extends BaseV4Request {
  public Data: CanConnectToVoiceSessionData = new CanConnectToVoiceSessionData();
}
