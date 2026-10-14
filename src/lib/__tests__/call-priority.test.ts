import { CallPriorityBaseTypes } from '../base-types';
import { type CallPriorityLike, compareCallPrioritiesAscending } from '../call-priority';

const byId = (priorities: CallPriorityLike[]) => new Map(priorities.map((p) => [p.Id, p]));

const sortIds = (ids: number[], priorities: Map<number, CallPriorityLike>, order: 'asc' | 'desc') =>
  [...ids].sort((a, b) => {
    const cmp = compareCallPrioritiesAscending(a, b, priorities);
    return order === 'desc' ? -cmp : cmp;
  });

describe('compareCallPrioritiesAscending', () => {
  it('orders department priorities by meaning, not by id (creation order)', () => {
    const priorities = byId([
      { Id: 57, BaseType: CallPriorityBaseTypes.Emergency, Sort: 0 },
      { Id: 58, BaseType: CallPriorityBaseTypes.Low, Sort: 1 },
      { Id: 59, BaseType: CallPriorityBaseTypes.High, Sort: 2 },
    ]);

    expect(sortIds([57, 58, 59], priorities, 'asc')).toEqual([58, 59, 57]);
    expect(sortIds([57, 58, 59], priorities, 'desc')).toEqual([57, 59, 58]);
  });

  it('keeps the built-in order the column always had (ascending = least urgent first)', () => {
    const priorities = byId([
      { Id: 0, BaseType: CallPriorityBaseTypes.Low, Sort: 0 },
      { Id: 1, BaseType: CallPriorityBaseTypes.Medium, Sort: 0 },
      { Id: 2, BaseType: CallPriorityBaseTypes.High, Sort: 0 },
      { Id: 3, BaseType: CallPriorityBaseTypes.Emergency, Sort: 0 },
    ]);

    expect(sortIds([3, 0, 2, 1], priorities, 'asc')).toEqual([0, 1, 2, 3]);
    expect(sortIds([3, 0, 2, 1], priorities, 'desc')).toEqual([3, 2, 1, 0]);
  });

  it('breaks ties between equal meanings with the department sort order', () => {
    const priorities = byId([
      { Id: 70, BaseType: CallPriorityBaseTypes.High, Sort: 5 },
      { Id: 71, BaseType: CallPriorityBaseTypes.High, Sort: 1 },
    ]);

    expect(sortIds([70, 71], priorities, 'desc')).toEqual([71, 70]);
  });

  it('treats a priority with no meaning as the least urgent', () => {
    const priorities = byId([
      { Id: 80, BaseType: CallPriorityBaseTypes.None, Sort: 0 },
      { Id: 81, BaseType: CallPriorityBaseTypes.Medium, Sort: 0 },
    ]);

    // 999 is not in the department's list. The meaningless ones keep their raw id order among themselves.
    expect(sortIds([81, 80, 999], priorities, 'desc')).toEqual([81, 999, 80]);
    expect(sortIds([81, 80, 999], priorities, 'asc')).toEqual([80, 999, 81]);
  });

  it('compares raw ids as before when the server sends no meanings', () => {
    const priorities = byId([{ Id: 60 }, { Id: 12 }, { Id: 31 }]);

    expect(sortIds([60, 12, 31], priorities, 'asc')).toEqual([12, 31, 60]);
    expect(sortIds([60, 12, 31], new Map(), 'desc')).toEqual([60, 31, 12]);
  });
});
