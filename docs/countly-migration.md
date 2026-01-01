# Analytics Migration: Aptabase to Countly

## Migration Completed

This project has been successfully migrated from Aptabase to Countly for analytics tracking while maintaining full backward compatibility.

## Previous Aptabase Implementation

Previously, the application used Aptabase for analytics with comprehensive error handling:

- **Aptabase Service**: Centralized error handling and retry logic
- **Aptabase Provider Wrapper**: Error-safe provider with fallback rendering
- **Simple Configuration**: Single app key configuration

## Current Countly Implementation

### 1. Countly Service (`src/services/analytics.service.ts`)

- **Purpose**: Centralized analytics tracking with error handling
- **Features**:
  - Simple event tracking interface compatible with previous Aptabase interface
  - Graceful error handling with retry logic
  - Automatic service disable/enable after failures
  - Comprehensive logging of events and errors
  - Converts event properties to Countly segmentation format

### 2. Countly Provider Wrapper (`src/components/common/aptabase-provider.tsx`)

- **Purpose**: Initializes Countly SDK with error handling
- **Features**:
  - Safe initialization with error recovery
  - Uses the Countly service for error management
  - Always renders children (no provider wrapper required)
  - Configurable with app key and server URL
  - Backward compatible `AptabaseProviderWrapper` export

### 3. Updated Layout (`src/app/_layout.tsx`)

- **Purpose**: Uses the new Countly wrapper with updated configuration
- **Change**: Updated to pass both `COUNTLY_APP_KEY` and `COUNTLY_SERVER_URL`

## Key Benefits of Migration

### Enhanced Analytics Capabilities

- More detailed event segmentation
- Better crash reporting integration
- Real-time analytics dashboard
- Advanced user analytics features

### Improved Performance

- Lightweight SDK with optimized network usage
- Better error recovery mechanisms
- Enhanced offline support

### Better Configuration Control

- Separate app key and server URL configuration
- More granular control over analytics features
- Better integration with crash reporting

## Configuration

The system uses environment variables for Countly configuration:

- `COUNTLY_APP_KEY`: Countly application key
- `COUNTLY_SERVER_URL`: Countly server URL

When no app key is provided, the app runs without analytics entirely.

## Usage

The analytics interface remains exactly the same for backward compatibility:

### Using the Service Directly

```typescript
import { countlyService } from '@/services/analytics.service';

// Track a simple event
countlyService.trackEvent('user_login');

// Track an event with properties
countlyService.trackEvent('button_clicked', {
  button_name: 'submit',
  screen: 'login',
  user_type: 'premium'
});
```

### Using the Hook (Recommended)

```typescript
import { useAnalytics } from '@/hooks/use-analytics';

const { trackEvent } = useAnalytics();

// Track events
trackEvent('screen_view', { screen_name: 'dashboard' });
trackEvent('feature_used', { feature_name: 'gps_tracking' });
```

## Testing

The implementation includes comprehensive unit tests:

### Countly Service Tests (`src/services/__tests__/countly.service.test.ts`)

- Event tracking functionality with Countly API
- Error handling logic
- Retry mechanism
- Disable/enable functionality
- Status tracking
- Timer-based recovery
- Property conversion to Countly segmentation format

### Countly Provider Tests (`src/components/common/__tests__/countly-provider.test.tsx`)

- Component rendering with Countly enabled/disabled
- Error handling integration
- Configuration validation
- Service integration
- Backward compatibility testing

### Analytics Hook Tests (`src/hooks/__tests__/use-analytics.test.ts`)

- Hook functionality
- Service integration
- Event tracking validation

All tests pass successfully and provide good coverage of the analytics functionality.

## Migration Notes

### Backward Compatibility

- All existing analytics calls work without changes
- `AptabaseProviderWrapper` is still exported and functional
- Service interface maintained identical to Aptabase version
- Environment variables changed from `APTABASE_*` to `COUNTLY_*`

### Technical Changes

- Replaced `@aptabase/react-native` with `countly-sdk-react-native-bridge`
- Updated service to convert properties to Countly segmentation format
- Enhanced provider initialization with crash reporting support
- Improved mock implementations for testing

### No Breaking Changes

- All application functionality remains intact
- Analytics tracking continues to work seamlessly
- Error handling patterns preserved
- Performance characteristics maintained or improved

## Example Analytics Events

Here are some common analytics events with the new Countly implementation:

```typescript
// User authentication
countlyService.trackEvent('user_login', { method: 'email' });
countlyService.trackEvent('user_logout');

// Navigation
countlyService.trackEvent('screen_view', { screen_name: 'dashboard' });

// User actions
countlyService.trackEvent('button_clicked', { 
  button_name: 'emergency_call',
  screen: 'home'
});

// Feature usage
countlyService.trackEvent('feature_used', {
  feature_name: 'gps_tracking',
  enabled: true
});

// Error tracking (in addition to Sentry)
countlyService.trackEvent('error_occurred', {
  error_type: 'network',
  component: 'api_client'
});
```

## Best Practices

1. **Keep event names consistent**: Use snake_case for event names
2. **Include relevant context**: Add properties that help understand user behavior  
3. **Don't track sensitive data**: Avoid PII or sensitive information
4. **Use descriptive property names**: Make properties self-explanatory
5. **Track both success and failure**: Include error states for complete picture
6. **Leverage Countly's segmentation**: Use meaningful property values for better analytics

## Environment Setup

Add these variables to your environment configuration files (`.env.*`):

```bash
# Replace your existing Aptabase configuration
UNIT_COUNTLY_APP_KEY=your_countly_app_key_here
UNIT_COUNTLY_SERVER_URL=https://your-countly-server.com
```

The migration maintains full backward compatibility while providing enhanced analytics capabilities through Countly.
