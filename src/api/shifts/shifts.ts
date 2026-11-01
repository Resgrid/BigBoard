import { type ShiftDayResult } from '@/models/v4/shifts/shiftDayResult';
import { type ShiftDaysResult } from '@/models/v4/shifts/shiftDaysResult';
import { type ShiftResult } from '@/models/v4/shifts/shiftResult';
import { type ShiftsResult } from '@/models/v4/shifts/shiftsResult';
import { type SignupShiftDayResult } from '@/models/v4/shifts/signupShiftDayResult';

import { createApiEndpoint } from '../common/client';

const getAllShiftsApi = createApiEndpoint('/Shifts/GetShifts');
const getShiftApi = createApiEndpoint('/Shifts/GetShift');
const getTodaysShiftsApi = createApiEndpoint('/Shifts/GetTodaysShifts');
const getShiftDayApi = createApiEndpoint('/Shifts/GetShiftDay');
const signupForShiftDayApi = createApiEndpoint('/Shifts/SignupForShiftDay');

/** Result ids are strings, but the POST inputs bind numeric ids. */
const toNumericId = (id: string | number): number => (typeof id === 'number' ? id : Number.parseInt(id, 10));

export const getAllShifts = async () => {
  const response = await getAllShiftsApi.get<ShiftsResult>();
  return response.data;
};

export const getShift = async (shiftId: string) => {
  const response = await getShiftApi.get<ShiftResult>({ id: shiftId });
  return response.data;
};

export const getTodaysShifts = async () => {
  const response = await getTodaysShiftsApi.get<ShiftDaysResult>();
  return response.data;
};

export const getShiftDay = async (shiftDayId: string) => {
  const response = await getShiftDayApi.get<ShiftDayResult>({ id: shiftDayId });
  return response.data;
};

/** Signs the current user up; the server requires the group (team) the signup is under. */
export const signupForShiftDay = async (shiftDayId: string, groupId: string) => {
  const response = await signupForShiftDayApi.post<SignupShiftDayResult>({
    ShiftDayId: toNumericId(shiftDayId),
    GroupId: toNumericId(groupId),
  });
  return response.data;
};
