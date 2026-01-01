import { NavigationContainer } from '@react-navigation/native';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { SideMenu } from '../side-menu';

// Mock the stores
jest.mock('@/lib/auth', () => ({
  useAuthStore: jest.fn(() => ({
    profile: {
      sub: 'test-user-id',
      name: 'Test User',
    },
    logout: jest.fn(),
  })),
}));

jest.mock('@/stores/security/store', () => ({
  useSecurityStore: jest.fn(() => ({
    rights: {
      FullName: 'Test User',
      DepartmentName: 'Test Department',
      DepartmentCode: 'TEST',
    },
  })),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock lucide icons
jest.mock('lucide-react-native', () => ({
  Mail: 'Mail',
  Contact: 'Contact',
  Map: 'Map',
  Notebook: 'Notebook',
  ListTree: 'ListTree',
  Calendar: 'Calendar',
  CalendarCheck: 'CalendarCheck',
  Settings: 'Settings',
  LogOut: 'LogOut',
  Headphones: 'Headphones',
  Megaphone: 'Megaphone',
  Mic: 'Mic',
  Truck: 'Truck',
  User: 'User',
  Users: 'Users',
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <NavigationContainer>{children}</NavigationContainer>;
};

describe('SideMenu', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <SideMenu />
      </TestWrapper>
    );

    expect(screen.getByTestId('side-menu-container')).toBeTruthy();
  });

  it('should display user profile information', async () => {
    render(
      <TestWrapper>
        <SideMenu />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('side-menu-profile-name')).toBeTruthy();
      expect(screen.getByText('Test User')).toBeTruthy();
      expect(screen.getByText('Test Department')).toBeTruthy();
    });
  });

  it('should render all menu items', async () => {
    render(
      <TestWrapper>
        <SideMenu />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('side-menu-personnel')).toBeTruthy();
      expect(screen.getByTestId('side-menu-units')).toBeTruthy();
      expect(screen.getByTestId('side-menu-calls')).toBeTruthy();
      expect(screen.getByTestId('side-menu-messages')).toBeTruthy();
      expect(screen.getByTestId('side-menu-contacts')).toBeTruthy();
      expect(screen.getByTestId('side-menu-map')).toBeTruthy();
      expect(screen.getByTestId('side-menu-notes')).toBeTruthy();
      expect(screen.getByTestId('side-menu-protocols')).toBeTruthy();
      expect(screen.getByTestId('side-menu-calendar')).toBeTruthy();
      expect(screen.getByTestId('side-menu-shifts')).toBeTruthy();
      expect(screen.getByTestId('side-menu-settings')).toBeTruthy();
      expect(screen.getByTestId('side-menu-logout')).toBeTruthy();
    });
  });

  it('should show loading state when security store is not initialized', async () => {
    const { useSecurityStore } = require('@/stores/security/store');
    useSecurityStore.mockImplementationOnce(() => null);

    render(
      <TestWrapper>
        <SideMenu />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('side-menu-loading')).toBeTruthy();
    });
  });

  it('should handle missing profile data gracefully', async () => {
    const { useAuthStore } = require('@/lib/auth');
    useAuthStore.mockImplementationOnce(() => ({
      profile: null,
      logout: jest.fn(),
    }));

    const { useSecurityStore } = require('@/stores/security/store');
    useSecurityStore.mockImplementationOnce(() => ({
      rights: null,
    }));

    render(
      <TestWrapper>
        <SideMenu />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('side-menu-container')).toBeTruthy();
      // Should show translation keys for unknown user/department when not properly mocked
      expect(screen.getByText(/unknown_user|Unknown User/)).toBeTruthy();
      expect(screen.getByText(/unknown_department|Unknown Department/)).toBeTruthy();
    });
  });
});
