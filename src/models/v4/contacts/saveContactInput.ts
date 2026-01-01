import { type ContactType } from './contactResultData';

export interface SaveContactInput {
  contactId?: string;
  name: string;
  type: ContactType;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  imageUrl?: string;
  isImportant: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
