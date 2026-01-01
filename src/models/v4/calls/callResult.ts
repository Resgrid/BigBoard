import { BaseV4Request } from '../baseV4Request';
import { CallResultData } from './callResultData';

export interface CallResult {
  Success: boolean;
  Message: string | null;
  Call: {
    CallId: string;
    CallNumber: string;
    CallType: string;
    Address: string;
    Priority: number;
    Status: string;
    CallDateTime: string;
    Latitude: number;
    Longitude: number;
    Notes: string;
    // Add other fields as needed
  };
}

export class CallResult extends BaseV4Request {
  public Data: CallResultData = new CallResultData();
}
