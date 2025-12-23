# Address Search Implementation

This document describes the Google Maps Geocoding API integration added to the New Call component.

## Overview

The `handleAddressSearch` function in `src/app/call/new/index.tsx` provides address geocoding functionality using the Google Maps Geocoding API. It allows users to search for addresses and automatically populate location coordinates for new calls.

## Features

- **Input Validation**: Validates empty/null address strings and shows user-friendly error messages
- **Google Maps Integration**: Uses Google Maps Geocoding API with API key from app configuration
- **Single Result Handling**: Automatically selects location when only one result is found
- **Multiple Results Handling**: Shows a bottom sheet modal for user selection when multiple results are found
- **Error Handling**: Graceful error handling with appropriate user feedback
- **URL Encoding**: Properly encodes addresses with special characters for API requests
- **Loading States**: Shows loading indicator during API calls

## Implementation Details

### Component State

```typescript
const [showAddressSelection, setShowAddressSelection] = useState(false);
const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
const [addressResults, setAddressResults] = useState<GeocodingResult[]>([]);
```

### API Integration

The function uses:

- `useCoreStore().config.GoogleMapsKey` to retrieve the API key from CoreStore configuration
- `axios.get()` to make requests to the Google Maps Geocoding API
- Proper error handling for network issues and API errors

### User Interface

- **Search Button**: Located next to the address input field with a search icon
- **Loading State**: Button shows loading indicator during API calls
- **Bottom Sheet**: Custom bottom sheet component for address selection
- **Toast Messages**: User-friendly success and error messages

### Address Selection Flow

1. User enters an address in the input field
2. User clicks the search button (validates non-empty input)
3. App fetches Google Maps API key from configuration
4. API request is made to Google Maps Geocoding API
5. Results are processed:
   - **Single result**: Location is automatically selected
   - **Multiple results**: Bottom sheet opens for user selection
   - **No results**: Error message is displayed
   - **API error**: Generic error message is displayed

## Usage

Users can:

1. Enter an address in the "Address" field
2. Click the search icon button
3. If multiple addresses are found, select the correct one from the list
4. The selected location automatically populates the coordinates and map preview

## Testing

Comprehensive tests have been created in `src/app/call/new/__tests__/address-search.test.ts` covering:

- Input validation (empty/whitespace strings)
- API configuration (missing API key scenarios)
- Single and multiple geocoding results
- Error handling (network errors, API errors)
- Address encoding for special characters
- Data structure validation

### Test Coverage

- **Input Validation**: 2 tests
- **API Configuration**: 2 tests
- **Geocoding Results**: 4 tests
- **Error Handling**: 3 tests
- **Address Encoding**: 2 tests
- **Data Structure Validation**: 2 tests

**Total**: 15 comprehensive test cases

## Error Scenarios

The implementation handles:

- Empty or whitespace-only address input
- Missing Google Maps API key configuration
- Network connectivity issues
- API rate limiting or quota exceeded
- Invalid API responses
- Zero results from geocoding service
- Malformed API responses

## Translation Keys

The following translation keys are used:

- `calls.address_required` - Empty address validation
- `calls.address_found` - Successful geocoding
- `calls.address_not_found` - No results found
- `calls.geocoding_error` - API/network errors
- `calls.select_address` - Bottom sheet title

## Dependencies

- `axios` - HTTP client for API requests
- `@/stores/app/core-store` - CoreStore for configuration management
- `@/components/ui/bottom-sheet` - Address selection modal
- `@/components/ui/toast` - User notifications

## Future Enhancements

Potential improvements could include:

- Autocomplete/suggestions as user types
- Recent address history
- Favorite locations
- Integration with device location services
- Support for additional geocoding providers
