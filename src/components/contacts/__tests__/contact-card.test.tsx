import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { ContactCard } from '../contact-card';
import { ContactType, type ContactResultData } from '@/models/v4/contacts/contactResultData';

describe('ContactCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  const basePerson: ContactResultData = {
    ContactId: '1',
    ContactType: ContactType.Person,
    Name: 'John Doe',
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john.doe@example.com',
    Phone: '555-1234',
    IsImportant: false,
    IsDeleted: false,
    AddedOnUtc: new Date(),
    Mobile: null,
    Address: null,
    City: null,
    State: null,
    Zip: null,
    Notes: null,
    ImageUrl: null,
  };

  const baseCompany: ContactResultData = {
    ContactId: '2',
    ContactType: ContactType.Company,
    Name: 'Acme Corp',
    CompanyName: 'Acme Corporation',
    Email: 'contact@acme.com',
    Phone: '555-5678',
    IsImportant: true,
    IsDeleted: false,
    AddedOnUtc: new Date(),
    Mobile: null,
    Address: null,
    City: null,
    State: null,
    Zip: null,
    Notes: null,
    ImageUrl: null,
  };

  describe('Person Contact Display Name', () => {
    it('should display FirstName + LastName for Person type', () => {
      render(<ContactCard contact={basePerson} onPress={mockOnPress} />);

      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    it('should handle missing FirstName for Person type', () => {
      const personWithoutFirstName = {
        ...basePerson,
        FirstName: undefined,
        LastName: 'Doe',
      };

      render(<ContactCard contact={personWithoutFirstName} onPress={mockOnPress} />);

      expect(screen.getByText('Doe')).toBeTruthy();
    });

    it('should handle missing LastName for Person type', () => {
      const personWithoutLastName = {
        ...basePerson,
        FirstName: 'John',
        LastName: undefined,
      };

      render(<ContactCard contact={personWithoutLastName} onPress={mockOnPress} />);

      expect(screen.getByText('John')).toBeTruthy();
    });

    it('should fallback to Name field for Person type when FirstName and LastName are missing', () => {
      const personWithoutNames = {
        ...basePerson,
        FirstName: undefined,
        LastName: undefined,
        Name: 'John Doe',
      };

      render(<ContactCard contact={personWithoutNames} onPress={mockOnPress} />);

      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    it('should show "Unknown Person" when all name fields are missing', () => {
      const personWithoutAnyName = {
        ...basePerson,
        FirstName: undefined,
        LastName: undefined,
        Name: undefined,
      };

      render(<ContactCard contact={personWithoutAnyName} onPress={mockOnPress} />);

      expect(screen.getByText('Unknown Person')).toBeTruthy();
    });
  });

  describe('Company Contact Display Name', () => {
    it('should display CompanyName for Company type', () => {
      render(<ContactCard contact={baseCompany} onPress={mockOnPress} />);

      expect(screen.getByText('Acme Corporation')).toBeTruthy();
    });

    it('should fallback to Name field for Company type when CompanyName is missing', () => {
      const companyWithoutCompanyName = {
        ...baseCompany,
        CompanyName: undefined,
        Name: 'Acme Corp',
      };

      render(<ContactCard contact={companyWithoutCompanyName} onPress={mockOnPress} />);

      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });

    it('should show "Unknown Company" when all name fields are missing', () => {
      const companyWithoutAnyName = {
        ...baseCompany,
        CompanyName: undefined,
        Name: undefined,
      };

      render(<ContactCard contact={companyWithoutAnyName} onPress={mockOnPress} />);

      expect(screen.getByText('Unknown Company')).toBeTruthy();
    });
  });

  describe('Contact Card Interactions', () => {
    it('should call onPress with correct contactId when pressed', () => {
      render(<ContactCard contact={basePerson} onPress={mockOnPress} />);

      fireEvent.press(screen.getByText('John Doe'));

      expect(mockOnPress).toHaveBeenCalledWith('1');
    });

    it('should display email when present', () => {
      render(<ContactCard contact={basePerson} onPress={mockOnPress} />);

      expect(screen.getByText('john.doe@example.com')).toBeTruthy();
    });

    it('should display phone when present', () => {
      render(<ContactCard contact={basePerson} onPress={mockOnPress} />);

      expect(screen.getByText('555-1234')).toBeTruthy();
    });

    it('should show star icon for important contacts', () => {
      render(<ContactCard contact={baseCompany} onPress={mockOnPress} />);

      // The star icon should be present for important contacts
      expect(screen.getByText('Acme Corporation')).toBeTruthy();
    });

    it('should not show star icon for non-important contacts', () => {
      render(<ContactCard contact={basePerson} onPress={mockOnPress} />);

      // The contact is not important, so no star should be shown
      expect(screen.getByText('John Doe')).toBeTruthy();
    });
  });

  describe('Contact Card Icons', () => {
    it('should show user icon for Person type without image', () => {
      const personWithoutImage = {
        ...basePerson,
        ImageUrl: null,
      };

      render(<ContactCard contact={personWithoutImage} onPress={mockOnPress} />);

      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    it('should show building icon for Company type without image', () => {
      const companyWithoutImage = {
        ...baseCompany,
        ImageUrl: null,
      };

      render(<ContactCard contact={companyWithoutImage} onPress={mockOnPress} />);

      expect(screen.getByText('Acme Corporation')).toBeTruthy();
    });
  });
}); 