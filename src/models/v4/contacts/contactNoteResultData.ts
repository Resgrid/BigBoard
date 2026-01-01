export interface ContactNoteResultData {
  ContactNoteId: string;
  ContactId: string;
  ContactNoteTypeId: string;
  Note: string;
  NoteType: string;
  ShouldAlert: boolean;
  Visibility: number; // 0 Internal, 1 Visible to Client
  ExpiresOnUtc: Date;
  ExpiresOn: string;
  IsDeleted: boolean;
  AddedOnUtc: Date;
  AddedOn: string;
  AddedByUserId: string;
  AddedByName: string;
  EditedOnUtc: Date;
  EditedOn: string;
  EditedByUserId: string;
  EditedByName: string;
}
