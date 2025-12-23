import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VStack } from '@/components/ui/vstack';

import { useToastStore } from '../../stores/toast/store';
import { ToastMessage } from './toast';

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const insets = useSafeAreaInsets();

  // Position below status bar and navigation header
  // Use a larger offset to ensure toasts appear below any navigation content
  const topOffset = insets.top + 70; // Status bar height + generous navigation header height

  return (
    <VStack className="absolute inset-x-0 z-50 px-4" space="sm" style={{ top: topOffset }}>
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} {...toast} />
      ))}
    </VStack>
  );
};
