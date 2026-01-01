import { BaseV4Request } from '../baseV4Request';
import { type ContactCategoryResultData } from './contactCategoryResultData';

export class ContactsCategoriesResult extends BaseV4Request {
  public Data: ContactCategoryResultData[] = [];
}
