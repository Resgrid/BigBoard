import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import Configure from '../configure';

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    getBoolean: jest.fn(),
    getNumber: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  // The dashboard store pulls in @/lib/i18n, which calls i18n.use(initReactI18next) at import time.
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

jest.mock('nativewind', () => ({
  styled: jest.fn((Component: any) => Component),
  useColorScheme: jest.fn(() => ({ colorScheme: 'light' })),
}));

jest.mock('lucide-react-native', () => ({
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

// The filter section reaches for groups/personnel APIs on mount; the configure screen's
// tab switching is what is under test here, not that section's data loading.
jest.mock('@/components/configure/scheduled-calls-filter-section', () => ({
  ScheduledCallsFilterSection: () => null,
}));

describe('Configure screen', () => {
  it('renders the Unit Alerts content when the Unit Alerts tab is selected', () => {
    render(<Configure />);

    expect(screen.queryByTestId('configure-unitAlerts-content')).toBeNull();

    fireEvent.press(screen.getByTestId('configure-tab-unitAlerts'));

    expect(screen.getByTestId('configure-unitAlerts-content')).toBeVisible();
  });
});
