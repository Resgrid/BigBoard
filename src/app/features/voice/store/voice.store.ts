import {
  DepartmentVoiceChannelResultData,
  DepartmentVoiceResultData,
} from '@resgrid/ngx-resgridlib';
import { StreamManager } from 'openvidu-browser';

export interface VoiceState {
  isVoiceEnabled: boolean;
  isTransmitting: boolean;
  voipSystemInfo: DepartmentVoiceResultData | null;
  currentVoipStatus: string | null;
  currentActiveVoipChannel: DepartmentVoiceChannelResultData | null;
  channels: DepartmentVoiceChannelResultData[];
  subscribers: StreamManager[];
  participants: number;
}

export const initialState: VoiceState = {
  isVoiceEnabled: false,
  isTransmitting: false,
  voipSystemInfo: null,
  currentVoipStatus: 'Disconnected',
  currentActiveVoipChannel: null,
  channels: [],
  subscribers: [],
  participants: 0,
};
