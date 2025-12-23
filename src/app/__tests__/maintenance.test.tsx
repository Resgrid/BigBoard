import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import Maintenance from '../maintenance';
import { Env } from '@/lib/env';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/env', () => ({
  Env: {
    MAINTENANCE_MODE: true,
  },
}));

describe('Maintenance', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  it('should render maintenance page correctly', () => {
    render(<Maintenance />);

    expect(screen.getByText('maintenance.title')).toBeTruthy();
    expect(screen.getByText('maintenance.message')).toBeTruthy();
    expect(screen.getByText('maintenance.why_down_title')).toBeTruthy();
    expect(screen.getByText('maintenance.downtime_title')).toBeTruthy();
    expect(screen.getByText('maintenance.support_title')).toBeTruthy();
  });

  it('should display all info cards', () => {
    render(<Maintenance />);

    expect(screen.getByText('maintenance.why_down_message')).toBeTruthy();
    expect(screen.getByText('maintenance.downtime_message')).toBeTruthy();
    expect(screen.getByText('maintenance.support_message')).toBeTruthy();
  });

  it('should display support email', () => {
    render(<Maintenance />);

    expect(screen.getByText('support@resgrid.com')).toBeTruthy();
  });

  it('should redirect to login if maintenance mode is disabled', () => {
    (Env as any).MAINTENANCE_MODE = false;

    render(<Maintenance />);

    waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('should display copyright and version info', () => {
    render(<Maintenance />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeTruthy();
  });
});
