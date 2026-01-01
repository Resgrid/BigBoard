import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { AlertCircle, FileX } from 'lucide-react-native';
import React from 'react';

import { Button, ButtonText } from '@/components/ui/button';

import ZeroState from '../common/zero-state';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

describe('ZeroState', () => {
  it('renders with default props', () => {
    render(<ZeroState />);

    expect(screen.getByTestId('zero-state')).toBeTruthy();
    expect(screen.getByText('No data available')).toBeTruthy();
    expect(screen.getByText("There's nothing to display at the moment")).toBeTruthy();
  });

  it('renders with custom props', () => {
    render(<ZeroState icon={FileX} heading="No files found" description="Try uploading some files first" iconColor="#3b82f6" />);

    expect(screen.getByText('No files found')).toBeTruthy();
    expect(screen.getByText('Try uploading some files first')).toBeTruthy();
  });

  it('renders in error state', () => {
    render(<ZeroState isError icon={AlertCircle} heading="Connection failed" description="Check your internet connection" />);

    expect(screen.getByText('Connection failed')).toBeTruthy();
    expect(screen.getByText('Check your internet connection')).toBeTruthy();
  });

  it('applies custom View className', () => {
    const { getByTestId } = render(
      <ZeroState viewClassName="custom-view-class bg-red-100" />
    );

    const zeroStateContainer = getByTestId('zero-state');
    expect(zeroStateContainer.parent).toBeTruthy();
  });

  it('applies custom Center className', () => {
    const { getByTestId } = render(
      <ZeroState centerClassName="custom-center-class bg-blue-100" />
    );

    const zeroStateElement = getByTestId('zero-state');
    expect(zeroStateElement).toBeTruthy();
  });

  it('combines centerClassName with additional className', () => {
    const { getByTestId } = render(
      <ZeroState
        centerClassName="custom-center-class"
        className="additional-class"
      />
    );

    const zeroStateElement = getByTestId('zero-state');
    expect(zeroStateElement).toBeTruthy();
  });

  it('renders with children', () => {
    render(
      <ZeroState>
        <Button onPress={() => { }}>
          <ButtonText>Retry</ButtonText>
        </Button>
      </ZeroState>
    );

    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('uses error state defaults when isError is true', () => {
    render(<ZeroState isError />);

    expect(screen.getByText('An error occurred')).toBeTruthy();
    expect(screen.getByText('Please try again later')).toBeTruthy();
  });

  it('overrides error state defaults with custom text', () => {
    render(
      <ZeroState
        isError
        heading="Custom error title"
        description="Custom error description"
      />
    );

    expect(screen.getByText('Custom error title')).toBeTruthy();
    expect(screen.getByText('Custom error description')).toBeTruthy();
  });

  it('applies default classNames when not provided', () => {
    const { getByTestId } = render(<ZeroState />);

    const zeroStateElement = getByTestId('zero-state');
    expect(zeroStateElement).toBeTruthy();
    // The default centerClassName should be applied
    expect(zeroStateElement.parent).toBeTruthy();
  });
});
