import { ActionBaseTypes, StaffingBaseTypes } from '../base-types';
import { isPersonAvailable, isPersonInService, isPersonOnDuty, isPersonResponding, labelHasPhrase, summarizePersonnel } from '../personnel-status';

describe('labelHasPhrase', () => {
  it('matches whole words case-insensitively', () => {
    expect(labelHasPhrase('Available', 'available')).toBe(true);
    expect(labelHasPhrase('Available Station', 'available')).toBe(true);
    expect(labelHasPhrase('Responding to Scene', 'responding')).toBe(true);
    expect(labelHasPhrase('ON  DUTY', 'on duty')).toBe(true);
  });

  it('does not match inside another word or after "not"', () => {
    // The old check was `includes`, so "Unavailable" counted as available and "Not Responding" as responding.
    expect(labelHasPhrase('Unavailable', 'available')).toBe(false);
    expect(labelHasPhrase('Not Responding', 'responding')).toBe(false);
    expect(labelHasPhrase('Not Available', 'available')).toBe(false);
    expect(labelHasPhrase('Not on duty', 'on duty')).toBe(false);
  });

  it('is false for a missing label', () => {
    expect(labelHasPhrase('', 'available')).toBe(false);
    expect(labelHasPhrase(null, 'available')).toBe(false);
    expect(labelHasPhrase(undefined, 'available')).toBe(false);
  });
});

describe('personnel status meaning', () => {
  it('decides by the base type when the server sends one, whatever the label says', () => {
    const inQuarters = { Status: 'IN QUARTERS', StatusBaseType: ActionBaseTypes.InQuarters };
    const wheelsUp = { Status: 'Wheels Up', StatusBaseType: ActionBaseTypes.Enroute };
    const misleading = { Status: 'Available Soon', StatusBaseType: ActionBaseTypes.Unavailable };

    expect(isPersonAvailable(inQuarters)).toBe(true);
    expect(isPersonResponding(inQuarters)).toBe(false);
    expect(isPersonResponding(wheelsUp)).toBe(true);
    expect(isPersonAvailable(wheelsUp)).toBe(false);
    expect(isPersonAvailable(misleading)).toBe(false);
  });

  it('decides staffing by the base type when the server sends one', () => {
    expect(isPersonOnDuty({ Staffing: 'Pager Only', StaffingBaseType: StaffingBaseTypes.OnCall })).toBe(true);
    expect(isPersonOnDuty({ Staffing: 'On Duty', StaffingBaseType: StaffingBaseTypes.OffDuty })).toBe(false);
  });

  it('falls back to the label when the base type is missing or unset', () => {
    // Older servers send no base type; -1 is a department value nobody gave a meaning.
    expect(isPersonAvailable({ Status: 'Available' })).toBe(true);
    expect(isPersonAvailable({ Status: 'Unavailable', StatusBaseType: ActionBaseTypes.None })).toBe(false);
    expect(isPersonResponding({ Status: 'Responding', StatusBaseType: null })).toBe(true);
    expect(isPersonResponding({ Status: 'Not Responding' })).toBe(false);
    expect(isPersonOnDuty({ Staffing: 'On Duty' })).toBe(true);
    expect(isPersonOnDuty({ Staffing: 'Off Duty', StaffingBaseType: StaffingBaseTypes.None })).toBe(false);
  });

  it('counts personnel in service as committed, not available or off duty', () => {
    expect(isPersonInService({ Status: 'On Scene', StatusBaseType: ActionBaseTypes.OnScene })).toBe(true);
    expect(isPersonInService({ Status: 'IN QUARTERS', StatusBaseType: ActionBaseTypes.InQuarters })).toBe(false);
    expect(isPersonInService({ Status: 'Out', StatusBaseType: ActionBaseTypes.Unavailable })).toBe(false);
    expect(isPersonInService({ Status: 'Not Responding', StatusBaseType: ActionBaseTypes.NotResponding })).toBe(false);

    // Legacy label check, unchanged.
    expect(isPersonInService({ Status: 'Responding' })).toBe(true);
    expect(isPersonInService({ Status: 'Available' })).toBe(false);
    expect(isPersonInService({ Status: 'Off Duty' })).toBe(false);
    expect(isPersonInService({ Status: '' })).toBe(false);
  });

  it('summarizes a mixed board', () => {
    const counts = summarizePersonnel([
      { Status: 'IN QUARTERS', StatusBaseType: ActionBaseTypes.InQuarters, Staffing: 'Pager Only', StaffingBaseType: StaffingBaseTypes.OnCall },
      { Status: 'Wheels Up', StatusBaseType: ActionBaseTypes.Responding, Staffing: 'On Shift', StaffingBaseType: StaffingBaseTypes.OnShift },
      { Status: 'Unavailable', StatusBaseType: ActionBaseTypes.Unavailable, Staffing: 'Off Duty', StaffingBaseType: StaffingBaseTypes.OffDuty },
      { Status: 'Unavailable', Staffing: 'Off Duty' },
      { Status: 'Not Responding', Staffing: 'On Duty' },
      { Status: 'Available', Staffing: 'On Duty' },
    ]);

    expect(counts).toEqual({ total: 6, onDuty: 4, available: 2, responding: 1 });
  });
});
