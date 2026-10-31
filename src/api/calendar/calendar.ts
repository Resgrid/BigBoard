import { type CalendarItemResult } from '@/models/v4/calendar/calendarItemResult';
import { type CalendarItemsResult } from '@/models/v4/calendar/calendarItemsResult';
import { type CalendarItemTypesResult } from '@/models/v4/calendar/calendarItemTypesResult';
import { type SetCalendarAttendingResult } from '@/models/v4/calendar/setCalendarAttendingResult';

import { createApiEndpoint } from '../common/client';

const getCalendarItemsApi = createApiEndpoint('/Calendar/GetDepartmentCalendarItems');
const getCalendarItemApi = createApiEndpoint('/Calendar/GetCalendarItem');
const getCalendarItemTypesApi = createApiEndpoint('/Calendar/GetDepartmentCalendarItemTypes');
const getCalendarItemsForDateRangeApi = createApiEndpoint('/Calendar/GetDepartmentCalendarItemsInRange');
const setCalendarAttendingApi = createApiEndpoint('/Calendar/SetCalendarAttendingStatus');

export const getCalendarItems = async () => {
  const response = await getCalendarItemsApi.get<CalendarItemsResult>();
  return response.data;
};

export const getCalendarItem = async (calendarItemId: string) => {
  const response = await getCalendarItemApi.get<CalendarItemResult>({ id: calendarItemId });
  return response.data;
};

export const getCalendarItemTypes = async () => {
  const response = await getCalendarItemTypesApi.get<CalendarItemTypesResult>();
  return response.data;
};

export const getCalendarItemsForDateRange = async (startDate: string, endDate: string) => {
  const response = await getCalendarItemsForDateRangeApi.get<CalendarItemsResult>({
    start: startDate,
    end: endDate,
  });
  return response.data;
};

/** Type 1 = attending, 4 = not attending. */
export const setCalendarAttending = async (params: { calendarItemId: string; attending: boolean; note?: string }) => {
  const response = await setCalendarAttendingApi.post<SetCalendarAttendingResult>({
    CalendarEventId: params.calendarItemId,
    Type: params.attending === true ? 1 : 4,
    Note: params.note || '',
  });
  return response.data;
};
