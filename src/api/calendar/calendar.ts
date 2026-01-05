import { type CalendarItemResult } from '@/models/v4/calendar/calendarItemResult';
import { type CalendarItemsResult } from '@/models/v4/calendar/calendarItemsResult';
import { type CalendarItemTypesResult } from '@/models/v4/calendar/calendarItemTypesResult';
import { type SetCalendarAttendingResult } from '@/models/v4/calendar/setCalendarAttendingResult';

import { createApiEndpoint } from '../common/client';

const getCalendarItemsApi = createApiEndpoint('/Calendar/GetCalendarItems');
const getCalendarItemApi = createApiEndpoint('/Calendar/GetCalendarItem');
const getCalendarItemTypesApi = createApiEndpoint('/Calendar/GetCalendarItemTypes');
const getCalendarItemsForDateRangeApi = createApiEndpoint('/Calendar/GetCalendarItemsForDateRange');
const setCalendarAttendingApi = createApiEndpoint('/Calendar/SetCalendarAttending');

export const getCalendarItems = async () => {
  const response = await getCalendarItemsApi.get<CalendarItemsResult>();
  return response.data;
};

export const getCalendarItem = async (calendarItemId: string) => {
  const response = await getCalendarItemApi.get<CalendarItemResult>({
    calendarItemId: encodeURIComponent(calendarItemId),
  });
  return response.data;
};

export const getCalendarItemTypes = async () => {
  const response = await getCalendarItemTypesApi.get<CalendarItemTypesResult>();
  return response.data;
};

export const getCalendarItemsForDateRange = async (startDate: string, endDate: string) => {
  const response = await getCalendarItemsForDateRangeApi.get<CalendarItemsResult>({
    startDate: encodeURIComponent(startDate),
    endDate: encodeURIComponent(endDate),
  });
  return response.data;
};

export const setCalendarAttending = async (params: { calendarItemId: string; attending: boolean; note?: string }) => {
  const response = await setCalendarAttendingApi.post<SetCalendarAttendingResult>({
    calendarItemId: encodeURIComponent(params.calendarItemId),
    attending: params.attending,
    note: params.note,
  });
  return response.data;
};
