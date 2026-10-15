/**
 * Reads what a person's status and staffing level mean.
 *
 * The API sends `StatusBaseType` / `StaffingBaseType` (see base-types.ts) for built-in and department values alike, and
 * those decide. They are missing from older servers, and -1 for a department value nobody gave a meaning, so the
 * department's own label is still read in that case — as a whole word, and never when negated: "Unavailable" and
 * "Not Responding" used to be counted as available and responding because the old check was a plain substring match.
 */
import { hasBaseType, isPersonnelInService, isStaffingOnDuty, isStatusAvailable, isStatusResponding } from './base-types';

export interface PersonnelStatusFields {
  Status?: string | null;
  StatusBaseType?: number | null;
  Staffing?: string | null;
  StaffingBaseType?: number | null;
}

export interface PersonnelSummaryCounts {
  total: number;
  onDuty: number;
  available: number;
  responding: number;
}

/** True when the label contains the phrase as whole words, case-insensitively, and not as "not <phrase>" or "not-<phrase>". */
export const labelHasPhrase = (label: string | null | undefined, phrase: string): boolean => {
  const text = (label ?? '').trim().toLowerCase();

  if (!text) {
    return false;
  }

  const words = phrase.trim().toLowerCase().split(/\s+/).join('\\s+');

  return new RegExp(`\\b${words}\\b`).test(text) && !new RegExp(`\\bnot[\\s-]+${words}\\b`).test(text);
};

/** Available for another assignment (dispatch's rule: available or delayed). */
export const isPersonAvailable = (person: PersonnelStatusFields): boolean => (hasBaseType(person.StatusBaseType) ? isStatusAvailable(person.StatusBaseType) : labelHasPhrase(person.Status, 'available'));

/** Dispatched, responding or en route. */
export const isPersonResponding = (person: PersonnelStatusFields): boolean => (hasBaseType(person.StatusBaseType) ? isStatusResponding(person.StatusBaseType) : labelHasPhrase(person.Status, 'responding'));

/** On duty for staffing purposes. */
export const isPersonOnDuty = (person: PersonnelStatusFields): boolean => (hasBaseType(person.StaffingBaseType) ? isStaffingOnDuty(person.StaffingBaseType) : labelHasPhrase(person.Staffing, 'on duty'));

/** Personnel in service: the one definition every app shares (lib/base-types). */
export const isPersonInService = (person: PersonnelStatusFields): boolean => isPersonnelInService(person);

export const summarizePersonnel = (personnel: PersonnelStatusFields[]): PersonnelSummaryCounts => ({
  total: personnel.length,
  onDuty: personnel.filter(isPersonOnDuty).length,
  available: personnel.filter(isPersonAvailable).length,
  responding: personnel.filter(isPersonResponding).length,
});
