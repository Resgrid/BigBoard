# Radio Selection Fix for Status Bottom Sheet

## Issue Description
The radio selection indicator in the Status Bottom Sheet was not working correctly. The radio buttons were not getting filled in to show which option was currently selected.

## Root Cause
The issue was in the `handleCallSelect` function and RadioGroup value handling:

1. **Value mismatch**: The RadioGroup used `selectedCall?.CallId || ''` as its value, but when no call was selected (value "0"), the empty string didn't match the "No call selected" radio option.

2. **Incomplete selection handling**: The `handleCallSelect` function only handled cases where a valid call was found, but didn't handle the "No call selected" case (value "0").

3. **Button disabled state**: The Next button was disabled when `selectedCall` was null, preventing users from proceeding without selecting a call.

## Changes Made

### 1. Fixed handleCallSelect function
```typescript
const handleCallSelect = (callId: string) => {
  if (callId === '0') {
    setSelectedCall(null);
  } else {
    const call = calls.find((c) => c.CallId === callId);
    if (call) {
      setSelectedCall(call);
    }
  }
};
```

### 2. Updated RadioGroup value
```typescript
<RadioGroup value={selectedCall?.CallId || '0'} onChange={handleCallSelect}>
```
Changed from empty string `''` to `'0'` to match the "No call selected" radio option.

### 3. Removed Next button disabled state
```typescript
<Button onPress={handleNext} className="mt-4 w-full bg-blue-600">
  <ButtonText>{t('Next')}</ButtonText>
</Button>
```
Removed `isDisabled={!selectedCall}` to allow proceeding without a selected call.

### 4. Updated second step display
```typescript
<Text className="mb-2 font-medium">
  {t('Selected Call')}: {selectedCall ? `${selectedCall.Number} - ${selectedCall.Name}` : t('calls.no_call_selected')}
</Text>
```
Added conditional display to show "No call selected" when no call is chosen.

## Result
- Radio selection indicators now properly show the selected state
- Users can select "No call selected" option
- Users can proceed to the next step with or without a call selected
- The UI correctly displays the selected call or "No call selected" in the second step

## Testing
The component should now:
1. ✅ Show proper radio selection when a call is selected
2. ✅ Show proper radio selection when "No call selected" is chosen
3. ✅ Allow users to proceed with either selection
4. ✅ Display the correct selection summary in the note step
