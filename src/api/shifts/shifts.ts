import { type ShiftDayResult } from '@/models/v4/shifts/shiftDayResult';
import { type ShiftResult } from '@/models/v4/shifts/shiftResult';
import { type ShiftsResult } from '@/models/v4/shifts/shiftsResult';
import { type SignupShiftDayResult } from '@/models/v4/shifts/signupShiftDayResult';

import { createApiEndpoint } from '../common/client';

const getAllShiftsApi = createApiEndpoint('/Shifts/GetAllShifts');
const getShiftApi = createApiEndpoint('/Shifts/GetShift');
const getTodaysShiftsApi = createApiEndpoint('/Shifts/GetTodaysShifts');
const getShiftDayApi = createApiEndpoint('/Shifts/GetShiftDay');
const signupForShiftDayApi = createApiEndpoint('/Shifts/SignupForShiftDay');

export const getAllShifts = async () => {
  const response = await getAllShiftsApi.get<ShiftsResult>();
  return response.data;
};

export const getShift = async (shiftId: string) => {
  const response = await getShiftApi.get<ShiftResult>({
    shiftId: encodeURIComponent(shiftId),
  });
  return response.data;
};

export const getTodaysShifts = async () => {
  const response = await getTodaysShiftsApi.get<ShiftsResult>();
  return response.data;
};

export const getShiftDay = async (shiftDayId: string) => {
  const response = await getShiftDayApi.get<ShiftDayResult>({
    shiftDayId: encodeURIComponent(shiftDayId),
  });
  return response.data;
};

export const signupForShiftDay = async (shiftDayId: string, userId?: string) => {
  const response = await signupForShiftDayApi.post<SignupShiftDayResult>({
    shiftDayId: encodeURIComponent(shiftDayId),
    ...(userId && { userId: encodeURIComponent(userId) }),
  });
  return response.data;
};
