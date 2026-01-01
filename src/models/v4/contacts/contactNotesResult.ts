import { BaseV4Request } from '../baseV4Request';
import { type ContactNoteResultData } from './contactNoteResultData';

export class ContactsNotesResult extends BaseV4Request {
  public Data: ContactNoteResultData[] = [];
}
