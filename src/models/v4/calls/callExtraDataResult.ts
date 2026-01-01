import { BaseV4Request } from '../baseV4Request';
import { CallExtraDataResultData } from './callExtraDataResultData';

export interface CallExtraDataResult {
  Success: boolean;
  Message: string | null;
  CallExtraData: {
    AdditionalInfo: Record<string, string>;
    ContactInfo: {
      Name: string;
      Phone: string;
      Email: string;
    };
    Protocols: {
      Name: string;
      Description: string;
    }[];
    Dispatched: {
      Name: string;
      Unit: string;
      Status: string;
    }[];
    Timeline: {
      Timestamp: string;
      User: string;
      Unit: string;
      Status: string;
    }[];
    // Add other fields as needed
  };
}

export class CallExtraDataResult extends BaseV4Request {
  public Data: CallExtraDataResultData = new CallExtraDataResultData();
}
