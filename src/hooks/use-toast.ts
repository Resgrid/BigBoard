import { type ToastType, useToastStore } from '../stores/toast/store';

export const useToast = () => {
  const { showToast } = useToastStore();

  return {
    show: (type: ToastType, message: string, title?: string) => {
      showToast(type, message, title);
    },
    success: (message: string, title?: string) => {
      showToast('success', message, title);
    },
    error: (message: string, title?: string) => {
      showToast('error', message, title);
    },
    warning: (message: string, title?: string) => {
      showToast('warning', message, title);
    },
    info: (message: string, title?: string) => {
      showToast('info', message, title);
    },
  };
};
