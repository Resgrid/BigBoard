export const defineTask = jest.fn();
export const startLocationTrackingAsync = jest.fn().mockResolvedValue(undefined);
export const stopLocationTrackingAsync = jest.fn().mockResolvedValue(undefined);
export const hasStartedLocationTrackingAsync = jest.fn().mockResolvedValue(false);
export const getRegisteredTasksAsync = jest.fn().mockResolvedValue([]);
export const isTaskRegisteredAsync = jest.fn().mockResolvedValue(false);
export const unregisterTaskAsync = jest.fn().mockResolvedValue(undefined);
export const unregisterAllTasksAsync = jest.fn().mockResolvedValue(undefined);

const TaskManager = {
  defineTask,
  startLocationTrackingAsync,
  stopLocationTrackingAsync,
  hasStartedLocationTrackingAsync,
  getRegisteredTasksAsync,
  isTaskRegisteredAsync,
  unregisterTaskAsync,
  unregisterAllTasksAsync,
};

export default TaskManager;
