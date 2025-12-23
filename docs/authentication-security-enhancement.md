# Authentication & Security Enhancement Implementation

This document outlines the implementation of the new authentication and security features for the Resgrid Dispatch mobile application.

## Overview

Three major features have been implemented:

1. **Standalone Login Page** - A dedicated, always-shown login screen when users are not authenticated
2. **Lockscreen Functionality** - Auto-lock after configurable inactivity period with unlock mechanism
3. **Maintenance Mode** - Configurable maintenance page to prevent app access during system maintenance

## Features Implemented

### 1. Maintenance Mode

**Location**: `src/app/maintenance.tsx`

A full-screen maintenance page that displays when the `MAINTENANCE_MODE` environment variable is enabled.

**Features**:
- Mobile-responsive design with dark mode support
- Three informational cards explaining:
  - Why the site is down
  - Expected downtime
  - Support contact information
- Resgrid branding and version display
- Multi-language support (English & Arabic)

**Environment Variable**:
```env
DISPATCH_MAINTENANCE_MODE=true  # Enable maintenance mode
DISPATCH_MAINTENANCE_MODE=false # Disable maintenance mode (default)
```

**Configuration**: Added to `env.js`:
```javascript
MAINTENANCE_MODE: process.env.DISPATCH_MAINTENANCE_MODE === 'true' || false
```

---

### 2. Lockscreen Functionality

**Location**: 
- Component: `src/app/lockscreen.tsx`
- Store: `src/stores/lockscreen/store.tsx`
- Hook: `src/hooks/use-inactivity-lock.tsx`

A security feature that locks the app after a configurable period of inactivity.

**Features**:
- Password/PIN entry screen with show/hide toggle
- User avatar display
- Configurable auto-lock timeout (default: 5 minutes)
- Activity tracking across app lifecycle
- Background/foreground state handling
- "Not you?" logout option
- Loading states during unlock
- Dark mode support
- Multi-language support

**Store State** (`useLockscreenStore`):
```typescript
{
  isLocked: boolean;           // Current lock state
  lockTimeout: number;         // Timeout in minutes (0 = disabled)
  lastActivityTime: number | null; // Last user activity timestamp
}
```

**Store Actions**:
- `lock()` - Lock the screen
- `unlock()` - Unlock the screen and update activity time
- `updateActivity()` - Update last activity timestamp
- `setLockTimeout(minutes)` - Set auto-lock timeout
- `shouldLock()` - Check if screen should be locked based on inactivity

**Inactivity Hook** (`useInactivityLock`):
- Monitors app state changes (active/background)
- Tracks user interactions
- Triggers lockscreen after timeout
- Clears timers when app goes to background
- Returns `handleActivity()` for manual activity updates

**Configuration**:
```typescript
// Set lock timeout (in minutes)
useLockscreenStore.getState().setLockTimeout(10); // 10 minutes
useLockscreenStore.getState().setLockTimeout(0);  // Disable auto-lock
```

---

### 3. Enhanced Login Page

**Location**: `src/app/login/login-form.tsx`

Updated to match the Angular application's design with improved UX.

**Enhancements**:
- Updated page title and subtitle with translations
- Added footer with copyright and registration link
- Improved spacing and layout
- Dark mode support
- Consistent branding

**New Translation Keys**:
```json
{
  "login": {
    "page_title": "Resgrid Dispatch",
    "page_subtitle": "Enter the information below to Sign in...",
    "footer_text": "Created with ❤️ in Lake Tahoe",
    "no_account": "Don't have an account?",
    "register": "Register"
  }
}
```

---

## Authentication Flow

### Route Protection

The app now implements a multi-layered authentication guard in `src/app/(app)/_layout.tsx`:

```
1. Check MAINTENANCE_MODE
   ↓ (if enabled) → Redirect to /maintenance
   
2. Check isLocked && isAuthenticated
   ↓ (if locked) → Redirect to /lockscreen
   
3. Check isFirstTime
   ↓ (if first time) → Redirect to /onboarding
   
4. Check authentication status
   ↓ (if not authenticated) → Redirect to /login
   
5. Render app content
```

### Priority Order:
1. **Maintenance Mode** (highest priority)
2. **Lockscreen** (for authenticated users)
3. **Onboarding** (first-time users)
4. **Login** (unauthenticated users)
5. **App** (authenticated & unlocked)

---

## Translation Keys

### English (`src/translations/en.json`)

```json
{
  "login": {
    "page_title": "Resgrid Dispatch",
    "page_subtitle": "Enter the information below to Sign in to the Resgrid Dispatch application.",
    "footer_text": "Created with ❤️ in Lake Tahoe",
    "no_account": "Don't have an account?",
    "register": "Register"
  },
  "lockscreen": {
    "title": "Lock Screen",
    "message": "Enter your password to unlock the screen",
    "password": "Password",
    "password_placeholder": "Enter your password",
    "unlock_button": "Unlock",
    "unlocking": "Unlocking...",
    "unlock_failed": "Failed to unlock. Please try again.",
    "welcome_back": "Welcome Back",
    "not_you": "Not you? Return to login"
  },
  "maintenance": {
    "title": "Site is Under Maintenance",
    "message": "Please check back in sometime.",
    "why_down_title": "Why is the Site Down?",
    "why_down_message": "We are performing scheduled maintenance...",
    "downtime_title": "What is the Downtime?",
    "downtime_message": "We are working hard to complete...",
    "support_title": "Do you need Support?",
    "support_message": "If you need assistance, please contact us at"
  }
}
```

### Arabic (`src/translations/ar.json`)
Full Arabic translations provided for all new keys.

---

## Testing

Comprehensive test suites have been created:

### Test Files:
1. **`src/app/__tests__/maintenance.test.tsx`**
   - Renders correctly
   - Displays all info cards
   - Shows support email
   - Redirects when maintenance disabled
   - Shows copyright info

2. **`src/app/__tests__/lockscreen.test.tsx`**
   - Renders correctly
   - Password input functionality
   - Toggle password visibility
   - Unlock submission
   - Error handling
   - Logout functionality
   - Loading states

3. **`src/stores/lockscreen/__tests__/store.test.tsx`**
   - Store initialization
   - Lock/unlock actions
   - Activity tracking
   - Timeout configuration
   - shouldLock logic

4. **`src/hooks/__tests__/use-inactivity-lock.test.tsx`**
   - Timer management
   - Authentication state handling
   - Screen locking triggers
   - Activity updates
   - Background state handling

5. **`src/app/(app)/__tests__/_layout.auth-guard.test.tsx`**
   - Maintenance redirect
   - Lockscreen redirect
   - Onboarding redirect
   - Login redirect
   - Content rendering
   - Priority order

---

## Usage Examples

### Lock/Unlock Screen Programmatically

```typescript
import useLockscreenStore from '@/stores/lockscreen/store';

// Lock the screen
useLockscreenStore.getState().lock();

// Unlock the screen
useLockscreenStore.getState().unlock();

// Check if should lock
if (useLockscreenStore.getState().shouldLock()) {
  useLockscreenStore.getState().lock();
}
```

### Configure Auto-Lock Timeout

```typescript
import useLockscreenStore from '@/stores/lockscreen/store';

// Set timeout to 10 minutes
useLockscreenStore.getState().setLockTimeout(10);

// Disable auto-lock
useLockscreenStore.getState().setLockTimeout(0);
```

### Track User Activity

```typescript
import { useInactivityLock } from '@/hooks/use-inactivity-lock';

function MyComponent() {
  const { handleActivity } = useInactivityLock(isAuthenticated);
  
  return (
    <View onTouchStart={handleActivity}>
      {/* Your content */}
    </View>
  );
}
```

### Enable Maintenance Mode

1. Set environment variable:
   ```bash
   export DISPATCH_MAINTENANCE_MODE=true
   ```

2. Restart the app
3. All users will see the maintenance page

---

## Architecture Decisions

### 1. **Zustand Store for Lockscreen**
- Persisted state across app restarts
- Simple, performant state management
- Easy to test and mock

### 2. **Inactivity Hook Pattern**
- Separates concerns (tracking vs. UI)
- Reusable across components
- Handles app lifecycle events

### 3. **Route-Level Guards**
- Centralized authentication logic
- Easy to maintain and debug
- Clear priority order

### 4. **Environment-Based Maintenance Mode**
- No code changes required
- Easy to enable/disable
- Works across all environments

---

## Best Practices

### Security
- Lock timeout is configurable (can be disabled if needed)
- Password verification happens on unlock attempt
- Logout option always available
- Session persists through lock/unlock

### UX
- Clear messaging on all screens
- Loading states for all async operations
- Dark mode support throughout
- Accessible design (WCAG compliant)

### Performance
- Minimal re-renders with Zustand
- Timer cleanup on unmount
- Efficient activity tracking
- Background state handling

---

## Future Enhancements

Potential improvements for future iterations:

1. **PIN Code Option**
   - 4-6 digit PIN instead of password
   - Biometric unlock (Face ID / Touch ID)

2. **Lockscreen Customization**
   - User-selectable timeout values
   - Custom messages
   - Theme options

3. **Activity Tracking**
   - Detailed activity logs
   - Security audit trail
   - Failed unlock attempts counter

4. **Maintenance Scheduling**
   - Scheduled maintenance windows
   - Countdown timer
   - Email notifications

5. **Multi-Factor Authentication**
   - SMS verification
   - Email verification
   - Authenticator app support

---

## Migration Guide

### For Existing Users

No migration needed. Features are:
- **Maintenance Mode**: Disabled by default
- **Lockscreen**: Inactive until user is authenticated
- **Login**: Enhanced UI with backward compatibility

### Environment Variables

Add to your `.env` files:
```env
DISPATCH_MAINTENANCE_MODE=false
```

---

## Troubleshooting

### Lockscreen Won't Unlock
- Check password is correct
- Try logout and re-login
- Clear app data if persisted state is corrupted

### Maintenance Page Won't Disable
- Verify `DISPATCH_MAINTENANCE_MODE=false`
- Restart the app
- Clear build cache

### Inactivity Timer Not Working
- Check `lockTimeout` is set to non-zero value
- Verify app has proper permissions
- Check console logs for timer issues

---

## API Reference

### useLockscreenStore

```typescript
interface LockscreenState {
  isLocked: boolean;
  lockTimeout: number;
  lastActivityTime: number | null;
  
  lock: () => void;
  unlock: () => void;
  updateActivity: () => void;
  setLockTimeout: (minutes: number) => void;
  shouldLock: () => boolean;
}
```

### useInactivityLock

```typescript
function useInactivityLock(
  isAuthenticated: boolean
): {
  handleActivity: () => void;
}
```

---

## Related Files

### Core Implementation
- `src/app/maintenance.tsx` - Maintenance page
- `src/app/lockscreen.tsx` - Lockscreen page
- `src/app/login/login-form.tsx` - Enhanced login form
- `src/stores/lockscreen/store.tsx` - Lockscreen state management
- `src/hooks/use-inactivity-lock.tsx` - Inactivity tracking hook
- `src/app/(app)/_layout.tsx` - Auth guard implementation

### Configuration
- `env.js` - Environment variable schema

### Translations
- `src/translations/en.json` - English translations
- `src/translations/ar.json` - Arabic translations

### Tests
- `src/app/__tests__/maintenance.test.tsx`
- `src/app/__tests__/lockscreen.test.tsx`
- `src/stores/lockscreen/__tests__/store.test.tsx`
- `src/hooks/__tests__/use-inactivity-lock.test.tsx`
- `src/app/(app)/__tests__/_layout.auth-guard.test.tsx`

---

## Summary

This implementation provides a robust, secure, and user-friendly authentication system with:

✅ Standalone login page with enhanced design  
✅ Auto-locking after configurable inactivity  
✅ Maintenance mode for system updates  
✅ Comprehensive test coverage  
✅ Multi-language support  
✅ Dark mode support  
✅ Accessibility compliance  
✅ TypeScript type safety  

All features follow React Native and Expo best practices, with consideration for mobile platforms (iOS & Android).
