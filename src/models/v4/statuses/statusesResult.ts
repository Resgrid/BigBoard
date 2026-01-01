import { BaseV4Request } from '../baseV4Request';
import { type StatusesResultData } from './statusesResultData';

export class StatusesResult extends BaseV4Request {
  public Data: StatusesResultData[] = [];
}
