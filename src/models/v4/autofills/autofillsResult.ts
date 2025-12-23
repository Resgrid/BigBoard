import { BaseV4Request } from '../baseV4Request';
import { type AutofillResultData } from './autofillsResultData';

export class AutofillsResult extends BaseV4Request {
  public Data: AutofillResultData[] = [];
}
