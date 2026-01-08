import { addDays, endOfDay, format, startOfDay, subDays } from 'date-fns';
import { create } from 'zustand';

import { getCalendarItem, getCalendarItems, getCalendarItemsForDateRange, getCalendarItemTypes, setCalendarAttending } from '@/api/calendar/calendar';
import { logger } from '@/lib/logging';
import { isSameDate } from '@/lib/utils';
import { type CalendarItemResultData } from '@/models/v4/calendar/calendarItemResultData';
import { type GetAllCalendarItemTypesResult } from '@/models/v4/calendar/calendarItemTypeResultData';
import type { ApiResponse } from '@/types/api';

interface CalendarState {
  // Data - matching Angular implementation
  todayCalendarItems: CalendarItemResultData[];
  upcomingCalendarItems: CalendarItemResultData[];
  calendarItems: CalendarItemResultData[];
  viewCalendarItem: CalendarItemResultData | null;
  selectedDate: string | null;
  selectedMonthItems: CalendarItemResultData[];
  itemTypes: GetAllCalendarItemTypesResult[];
  updateCalendarItems: boolean;

  // Loading states
  isLoading: boolean;
  isTodaysLoading: boolean;
  isUpcomingLoading: boolean;
  isItemLoading: boolean;
  isAttendanceLoading: boolean;
  isTypesLoading: boolean;

  // Error states
  error: string | null;
  attendanceError: string | null;

  // Actions - matching Angular implementation
  loadTodaysCalendarItems: () => Promise<void>;
  loadUpcomingCalendarItems: () => Promise<void>;
  loadCalendarItems: () => Promise<void>;
  loadCalendarItemsForDateRange: (startDate: string, endDate: string) => Promise<void>;
  viewCalendarItemAction: (item: CalendarItemResultData) => void;
  setCalendarItemAttendingStatus: (calendarItemId: string, note: string, status: number) => Promise<void>;
  fetchCalendarItem: (calendarItemId: string) => Promise<void>;
  fetchItemTypes: () => Promise<void>;
  setSelectedDate: (date: string | null) => void;
  clearSelectedItem: () => void;
  clearError: () => void;
  dismissModal: () => void;
  init: () => Promise<void>;

  // Legacy aliases for backward compatibility
  fetchTodaysItems: () => Promise<void>;
  fetchUpcomingItems: () => Promise<void>;
  fetchItemsForDateRange: (startDate: string, endDate: string) => Promise<void>;
  setAttendance: (calendarItemId: string, attending: boolean, note?: string) => Promise<void>;

  // Data getters matching Angular implementation (computed properties)
  get todaysItems(): CalendarItemResultData[];
  get upcomingItems(): CalendarItemResultData[];
  get selectedItem(): CalendarItemResultData | null;
  get items(): CalendarItemResultData[];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state - matching Angular implementation
  todayCalendarItems: [],
  upcomingCalendarItems: [],
  calendarItems: [],
  viewCalendarItem: null,
  selectedDate: null,
  selectedMonthItems: [],
  itemTypes: [],
  updateCalendarItems: false,
  isLoading: false,
  isTodaysLoading: false,
  isUpcomingLoading: false,
  isItemLoading: false,
  isAttendanceLoading: false,
  isTypesLoading: false,
  error: null,
  attendanceError: null,

  // Computed properties for backward compatibility
  get todaysItems() {
    return get().todayCalendarItems;
  },
  get upcomingItems() {
    return get().upcomingCalendarItems;
  },
  get selectedItem() {
    return get().viewCalendarItem;
  },
  get items() {
    return get().calendarItems;
  },

  // Actions - matching Angular implementation
  loadTodaysCalendarItems: async () => {
    set({ isTodaysLoading: true, error: null });
    try {
      const today = new Date();
      // Use ISO date format for better timezone handling
      //const startDate = format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
      //const endDate = format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");

      logger.info({
        message: "Loading today's calendar items",
        context: { todayISO: today.toISOString() },
      });

      const response = await getCalendarItemsForDateRange(today.toISOString(), today.toISOString());

      // Filter items to ensure they're really for today (additional client-side validation)
      // Use Start field for date comparison as it contains the timezone-aware date from .NET backend
      const todayItems = response.Data.filter((item: CalendarItemResultData) => {
        return isSameDate(item.Start, new Date());
      });

      set({
        todayCalendarItems: todayItems,
        isTodaysLoading: false,
        updateCalendarItems: false,
      });
      logger.info({
        message: "Today's calendar items loaded successfully",
        context: {
          totalCount: response.Data.length,
          filteredCount: todayItems.length,
          //startDate,
          //endDate,
          items: todayItems.map((item: CalendarItemResultData) => ({
            id: item.CalendarItemId,
            title: item.Title,
            start: item.Start,
            startDate: new Date(item.Start).toDateString(),
          })),
        },
      });
    } catch (error) {
      logger.error({
        message: "Failed to load today's calendar items",
        context: { error },
      });
      set({ error: "Failed to load today's items", isTodaysLoading: false });
    }
  },

  loadUpcomingCalendarItems: async () => {
    set({ isUpcomingLoading: true, error: null });
    try {
      const today = new Date();
      const startDate = format(startOfDay(today), 'yyyy-MM-dd HH:mm:ss');
      const endDate = format(endOfDay(addDays(today, 7)), 'yyyy-MM-dd HH:mm:ss');

      const response = await getCalendarItemsForDateRange(startDate, endDate);
      set({
        upcomingCalendarItems: response.Data,
        isUpcomingLoading: false,
        updateCalendarItems: false,
      });
      logger.info({
        message: 'Upcoming calendar items loaded successfully',
        context: { count: response.Data.length, startDate, endDate },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to load upcoming calendar items',
        context: { error },
      });
      set({ error: 'Failed to load upcoming items', isUpcomingLoading: false });
    }
  },

  loadCalendarItems: async () => {
    set({ isLoading: true, error: null });
    try {
      // Load calendar items for extended date range (matching Angular: -90 to +120 days)
      const startDate = subDays(new Date(), 90).toISOString().split('T')[0]!;
      const endDate = addDays(new Date(), 120).toISOString().split('T')[0]!;

      const response = await getCalendarItemsForDateRange(startDate, endDate);
      set({
        calendarItems: response.Data,
        isLoading: false,
        updateCalendarItems: false,
      });
      logger.info({
        message: 'Calendar items loaded successfully',
        context: { count: response.Data.length, startDate, endDate },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to load calendar items',
        context: { error },
      });
      set({ error: 'Failed to load calendar items', isLoading: false });
    }
  },

  loadCalendarItemsForDateRange: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getCalendarItemsForDateRange(startDate, endDate);
      set({
        selectedMonthItems: response.Data,
        isLoading: false,
        updateCalendarItems: false,
      });
      logger.info({
        message: 'Calendar items for date range loaded successfully',
        context: { startDate, endDate, count: response.Data.length },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to load calendar items for date range',
        context: { error, startDate, endDate },
      });
      set({ error: 'Failed to load calendar items', isLoading: false });
    }
  },

  viewCalendarItemAction: (item: CalendarItemResultData) => {
    set({ viewCalendarItem: item });
    logger.info({
      message: 'Calendar item selected for viewing',
      context: { calendarItemId: item.CalendarItemId },
    });
  },

  setCalendarItemAttendingStatus: async (calendarItemId: string, note: string, status: number) => {
    set({ isAttendanceLoading: true, attendanceError: null, updateCalendarItems: true });
    try {
      const attending = status === 1; // 1 = attending, 4 = not attending
      await setCalendarAttending({ calendarItemId, attending, note });

      // Update the item in all relevant arrays
      const updateItemAttendance = (item: CalendarItemResultData) => (item.CalendarItemId === calendarItemId ? { ...item, Attending: attending } : item);

      set((state) => ({
        todayCalendarItems: state.todayCalendarItems.map(updateItemAttendance),
        upcomingCalendarItems: state.upcomingCalendarItems.map(updateItemAttendance),
        calendarItems: state.calendarItems.map(updateItemAttendance),
        selectedMonthItems: state.selectedMonthItems.map(updateItemAttendance),
        viewCalendarItem: state.viewCalendarItem?.CalendarItemId === calendarItemId ? { ...state.viewCalendarItem, Attending: attending } : state.viewCalendarItem,
        isAttendanceLoading: false,
        updateCalendarItems: false,
      }));

      logger.info({
        message: 'Calendar attendance status updated successfully',
        context: { calendarItemId, attending, status },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to update calendar attendance status',
        context: { error, calendarItemId, status },
      });
      set({
        attendanceError: 'Failed to update attendance status',
        isAttendanceLoading: false,
        updateCalendarItems: false,
      });
    }
  },

  fetchCalendarItem: async (calendarItemId: string) => {
    set({ isItemLoading: true, error: null });
    try {
      const response = await getCalendarItem(calendarItemId);
      set({ viewCalendarItem: response.Data, isItemLoading: false });
      logger.info({
        message: 'Calendar item fetched successfully',
        context: { calendarItemId },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to fetch calendar item',
        context: { error, calendarItemId },
      });
      set({ error: 'Failed to fetch calendar item', isItemLoading: false });
    }
  },

  fetchItemTypes: async () => {
    set({ isTypesLoading: true, error: null });
    try {
      const response = await getCalendarItemTypes();
      set({ itemTypes: response.Data, isTypesLoading: false });
      logger.info({
        message: 'Calendar item types fetched successfully',
        context: { count: response.Data.length },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to fetch calendar item types',
        context: { error },
      });
      set({ error: 'Failed to fetch item types', isTypesLoading: false });
    }
  },

  setSelectedDate: (date: string | null) => {
    set({ selectedDate: date });
  },

  clearSelectedItem: () => {
    set({ viewCalendarItem: null });
  },

  clearError: () => {
    set({ error: null, attendanceError: null });
  },

  dismissModal: () => {
    set({ viewCalendarItem: null });
  },

  init: async () => {
    logger.info({ message: 'Initializing calendar store' });
    await Promise.all([get().fetchItemTypes(), get().loadTodaysCalendarItems(), get().loadUpcomingCalendarItems()]);
  },

  // Legacy aliases for backward compatibility
  fetchTodaysItems: async () => {
    await get().loadTodaysCalendarItems();
  },

  fetchUpcomingItems: async () => {
    await get().loadUpcomingCalendarItems();
  },

  fetchItemsForDateRange: async (startDate: string, endDate: string) => {
    await get().loadCalendarItemsForDateRange(startDate, endDate);
  },

  setAttendance: async (calendarItemId: string, attending: boolean, note?: string) => {
    const status = attending ? 1 : 4;
    await get().setCalendarItemAttendingStatus(calendarItemId, note || '', status);
  },
}));
