import { comparePriorityUrgency, hasBaseType } from './base-types';

export interface CallPriorityLike {
  Id: number;
  BaseType?: number | null;
  Sort?: number | null;
}

/**
 * Compares two calls' priority ids for an ascending sort: least urgent first, so a descending sort puts the most urgent
 * on top. That is the order the column has always given the built-in priorities, whose ids run 0 Low .. 3 Emergency.
 *
 * Department priority ids are creation order, not urgency, so the raw ids cannot be compared once a department has its
 * own priorities. When the API says what a priority means (`BaseType`) that decides, then the department's sort order
 * (see comparePriorityUrgency); a priority with no meaning counts as the least urgent. When neither side has a meaning
 * (an older server) the raw ids are compared as before.
 */
export const compareCallPrioritiesAscending = (aPriorityId: number, bPriorityId: number, prioritiesById: ReadonlyMap<number, CallPriorityLike>): number => {
  const a = prioritiesById.get(aPriorityId);
  const b = prioritiesById.get(bPriorityId);

  if (!hasBaseType(a?.BaseType) && !hasBaseType(b?.BaseType)) {
    return aPriorityId - bPriorityId;
  }

  return -comparePriorityUrgency(a, b);
};
