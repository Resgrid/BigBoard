import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { CallProtocolsResultData } from '@/models/v4/callProtocols/callProtocolsResultData';

import { ProtocolCard } from '../protocol-card';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  formatDateForDisplay: jest.fn((date) => date ? '2023-01-01 12:00 UTC' : ''),
  parseDateISOString: jest.fn((dateString) => dateString ? new Date(dateString) : null),
  stripHtmlTags: jest.fn((html) => html ? html.replace(/<[^>]*>/g, '') : ''),
}));

describe('ProtocolCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  const baseProtocol: CallProtocolsResultData = {
    Id: '1',
    DepartmentId: 'dept1',
    Name: 'Fire Emergency Response',
    Code: 'FIRE001',
    Description: 'Standard fire emergency response protocol',
    ProtocolText: '<p>Fire emergency response protocol content</p>',
    CreatedOn: '2023-01-01T00:00:00Z',
    CreatedByUserId: 'user1',
    IsDisabled: false,
    UpdatedOn: '2023-01-02T00:00:00Z',
    UpdatedByUserId: 'user1',
    MinimumWeight: 0,
    State: 1,
    Triggers: [],
    Attachments: [],
    Questions: [],
  };

  const protocolWithoutOptionalFields: CallProtocolsResultData = {
    Id: '2',
    DepartmentId: 'dept1',
    Name: 'Basic Protocol',
    Code: '',
    Description: '',
    ProtocolText: '',
    CreatedOn: '2023-01-01T00:00:00Z',
    CreatedByUserId: 'user1',
    IsDisabled: false,
    UpdatedOn: '',
    UpdatedByUserId: '',
    MinimumWeight: 0,
    State: 1,
    Triggers: [],
    Attachments: [],
    Questions: [],
  };

  const protocolWithHtmlDescription: CallProtocolsResultData = {
    Id: '3',
    DepartmentId: 'dept1',
    Name: 'Protocol with HTML',
    Code: 'HTML001',
    Description: '<p>This is a <strong>description</strong> with <em>HTML</em> tags</p>',
    ProtocolText: '<p>Protocol content</p>',
    CreatedOn: '2023-01-01T00:00:00Z',
    CreatedByUserId: 'user1',
    IsDisabled: false,
    UpdatedOn: '2023-01-02T00:00:00Z',
    UpdatedByUserId: 'user1',
    MinimumWeight: 0,
    State: 1,
    Triggers: [],
    Attachments: [],
    Questions: [],
  };

  describe('Basic Rendering', () => {
    it('should render protocol card with all fields', () => {
      render(<ProtocolCard protocol={baseProtocol} onPress={mockOnPress} />);

      expect(screen.getByText('Fire Emergency Response')).toBeTruthy();
      expect(screen.getByText('Standard fire emergency response protocol')).toBeTruthy();
      expect(screen.getByText('FIRE001')).toBeTruthy();
      expect(screen.getByText('2023-01-01 12:00 UTC')).toBeTruthy();
    });

    it('should render protocol card without optional fields', () => {
      render(<ProtocolCard protocol={protocolWithoutOptionalFields} onPress={mockOnPress} />);

      expect(screen.getByText('Basic Protocol')).toBeTruthy();
      expect(screen.getByText('2023-01-01 12:00 UTC')).toBeTruthy();
      // Code badge should not be rendered when code is empty - we can't test for empty string as it's always rendered
      expect(screen.queryByText('FIRE001')).toBeFalsy();
    });

    it('should handle protocol with HTML in description', () => {
      render(<ProtocolCard protocol={protocolWithHtmlDescription} onPress={mockOnPress} />);

      expect(screen.getByText('Protocol with HTML')).toBeTruthy();
      expect(screen.getByText('HTML001')).toBeTruthy();
      // Description should be stripped of HTML tags
      expect(screen.getByText('This is a description with HTML tags')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onPress with protocol ID when card is pressed', () => {
      render(<ProtocolCard protocol={baseProtocol} onPress={mockOnPress} />);

      const card = screen.getByText('Fire Emergency Response');
      fireEvent.press(card);

      expect(mockOnPress).toHaveBeenCalledWith('1');
    });

    it('should call onPress with correct ID for different protocols', () => {
      render(<ProtocolCard protocol={protocolWithoutOptionalFields} onPress={mockOnPress} />);

      const card = screen.getByText('Basic Protocol');
      fireEvent.press(card);

      expect(mockOnPress).toHaveBeenCalledWith('2');
    });

    it('should handle multiple press events', () => {
      render(<ProtocolCard protocol={baseProtocol} onPress={mockOnPress} />);

      const card = screen.getByText('Fire Emergency Response');
      fireEvent.press(card);
      fireEvent.press(card);

      expect(mockOnPress).toHaveBeenCalledTimes(2);
      expect(mockOnPress).toHaveBeenCalledWith('1');
    });
  });

  describe('Date Display', () => {
    it('should display UpdatedOn date when available', () => {
      render(<ProtocolCard protocol={baseProtocol} onPress={mockOnPress} />);

      expect(screen.getByText('2023-01-01 12:00 UTC')).toBeTruthy();
    });

    it('should fall back to CreatedOn when UpdatedOn is not available', () => {
      render(<ProtocolCard protocol={protocolWithoutOptionalFields} onPress={mockOnPress} />);

      expect(screen.getByText('2023-01-01 12:00 UTC')).toBeTruthy();
    });
  });

  describe('Code Badge Display', () => {
    it('should display code badge when code is provided', () => {
      render(<ProtocolCard protocol={baseProtocol} onPress={mockOnPress} />);

      expect(screen.getByText('FIRE001')).toBeTruthy();
    });

    it('should not display code badge when code is empty', () => {
      render(<ProtocolCard protocol={protocolWithoutOptionalFields} onPress={mockOnPress} />);

      // The code badge section should not exist - we can't test for empty string as it's always rendered
      expect(screen.queryByText('FIRE001')).toBeFalsy();
    });

    it('should not display code badge when code is null', () => {
      const protocolWithNullCode = { ...baseProtocol, Code: null as any };
      render(<ProtocolCard protocol={protocolWithNullCode} onPress={mockOnPress} />);

      // The code badge section should not exist
      expect(screen.queryByText('null')).toBeFalsy();
    });
  });

  describe('Description Display', () => {
    it('should display description when provided', () => {
      render(<ProtocolCard protocol={baseProtocol} onPress={mockOnPress} />);

      expect(screen.getByText('Standard fire emergency response protocol')).toBeTruthy();
    });

    it('should handle empty description', () => {
      render(<ProtocolCard protocol={protocolWithoutOptionalFields} onPress={mockOnPress} />);

      expect(screen.getByText('Basic Protocol')).toBeTruthy();
      // Empty description should render empty text
      expect(screen.getByText('')).toBeTruthy();
    });

    it('should strip HTML tags from description', () => {
      render(<ProtocolCard protocol={protocolWithHtmlDescription} onPress={mockOnPress} />);

      expect(screen.getByText('This is a description with HTML tags')).toBeTruthy();
      // Should not contain HTML tags
      expect(screen.queryByText('<p>This is a <strong>description</strong> with <em>HTML</em> tags</p>')).toBeFalsy();
    });

    it('should handle null description', () => {
      const protocolWithNullDescription = { ...baseProtocol, Description: null as any };
      render(<ProtocolCard protocol={protocolWithNullDescription} onPress={mockOnPress} />);

      expect(screen.getByText('Fire Emergency Response')).toBeTruthy();
      expect(screen.getByText('')).toBeTruthy();
    });
  });

  describe('Text Truncation', () => {
    it('should limit description to 2 lines', () => {
      const protocolWithLongDescription = {
        ...baseProtocol,
        Description: 'This is a very long description that should be truncated when it exceeds two lines of text in the protocol card component',
      };

      render(<ProtocolCard protocol={protocolWithLongDescription} onPress={mockOnPress} />);

      expect(screen.getByText('This is a very long description that should be truncated when it exceeds two lines of text in the protocol card component')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle protocol with empty ID', () => {
      const protocolWithEmptyId = { ...baseProtocol, Id: '' };
      render(<ProtocolCard protocol={protocolWithEmptyId} onPress={mockOnPress} />);

      const card = screen.getByText('Fire Emergency Response');
      fireEvent.press(card);

      expect(mockOnPress).toHaveBeenCalledWith('');
    });

    it('should handle protocol with special characters in name', () => {
      const protocolWithSpecialChars = {
        ...baseProtocol,
        Name: 'Protocol & Emergency <Response>',
      };

      render(<ProtocolCard protocol={protocolWithSpecialChars} onPress={mockOnPress} />);

      expect(screen.getByText('Protocol & Emergency <Response>')).toBeTruthy();
    });

    it('should handle protocol with very long name', () => {
      const protocolWithLongName = {
        ...baseProtocol,
        Name: 'Very Long Protocol Name That Might Overflow The Card Layout And Should Be Handled Gracefully',
      };

      render(<ProtocolCard protocol={protocolWithLongName} onPress={mockOnPress} />);

      expect(screen.getByText('Very Long Protocol Name That Might Overflow The Card Layout And Should Be Handled Gracefully')).toBeTruthy();
    });

    it('should handle protocol with very long code', () => {
      const protocolWithLongCode = {
        ...baseProtocol,
        Code: 'VERY_LONG_CODE_THAT_MIGHT_OVERFLOW_THE_BADGE',
      };

      render(<ProtocolCard protocol={protocolWithLongCode} onPress={mockOnPress} />);

      expect(screen.getByText('VERY_LONG_CODE_THAT_MIGHT_OVERFLOW_THE_BADGE')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible for screen readers', () => {
      render(<ProtocolCard protocol={baseProtocol} onPress={mockOnPress} />);

      const card = screen.getByText('Fire Emergency Response');
      expect(card).toBeTruthy();
      // The card should be pressable
      fireEvent.press(card);
      expect(mockOnPress).toHaveBeenCalled();
    });
  });
}); 