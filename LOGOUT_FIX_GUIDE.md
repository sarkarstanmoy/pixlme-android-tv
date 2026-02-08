# 401 Logout Fix - Implementation & Testing Guide

## Problem
When the API returns `{"statusCode": 401}` (token expired), the app was not automatically logging out and redirecting to the sign-in screen.

## Root Cause
The `authContext` was not being updated synchronously when auth state changed, causing the axios interceptor to call an outdated `setAuth()` function reference.

## Changes Made

### 1. **authProvider.tsx** - Fixed Context Updates
- ✅ Made `setAuth` stable with `useCallback` to prevent unnecessary re-renders
- ✅ Added a second `useEffect` to update context whenever auth state changes
- ✅ Added comprehensive logging to track auth state changes

**Key Changes:**
```tsx
// Stable setAuth function
const setAuth = useCallback(() => {
  console.log('[AuthProvider] setAuth called - triggering auth recheck');
  setChangeInAuth(prev => prev + 1);
}, []);

// Update context immediately when auth state changes
useEffect(() => {
  console.log('[AuthProvider] Auth state changed:', {isAuthenticated, loading, refreshing});
  setAuthContext({isAuthenticated, loading, setAuth, refreshing});
}, [isAuthenticated, loading, setAuth, refreshing]);
```

### 2. **axios_instance.ts** - Enhanced Error Logging
- ✅ Added detailed logging when 401 is detected in response body
- ✅ Added logging for refresh failures and logout attempts
- ✅ Added logging to verify `setAuth()` is being called

**Key Logging Points:**
- When `statusCode: 401` is detected in response body
- When token refresh fails
- When auth data is cleared
- When `setAuth()` is called to trigger logout

### 3. **collectionActions.tsx** - Proper Error Handling
- ✅ Added `rejectWithValue` to both `getCollections` and `getCollectionById`
- ✅ Ensured errors are properly propagated to Redux state
- ✅ Added comments explaining that axios interceptor handles 401

## How the Flow Works Now

### Happy Path (Token Valid)
1. API request sent with token
2. Response received successfully
3. Data returned to Redux

### Token Expired - Refresh Success
1. API returns `{"statusCode": 401}`
2. Axios interceptor detects it
3. Automatically refreshes token
4. Retries original request with new token
5. User doesn't notice anything

### Token Expired - Refresh Failed (Logout)
1. API returns `{"statusCode": 401}`
2. Axios interceptor detects it
3. Attempts to refresh token → **FAILS**
4. **Clears auth data** from AsyncStorage
5. **Shows toast**: "Session expired. Please log in again."
6. **Calls `setAuth()`** to trigger re-authentication
7. `AuthProvider.checkAuth()` runs
8. Finds no token → sets `isAuthenticated = false`
9. **`AppNavigator` detects** `isAuthenticated = false`
10. **Redirects to `AuthNavigator`** (sign-in screen)

## Testing Instructions

### Method 1: Wait for Natural Token Expiry
1. Run the app in debug mode:
   ```bash
   npm start
   # In another terminal:
   npm run android
   ```
2. Login to the app
3. Wait for token to expire (check your token TTL)
4. Try to fetch collections (press refresh button)
5. Watch the console logs for the logout flow

### Method 2: Force 401 by Corrupting Token (Recommended)
1. Run the app in debug mode
2. Login to the app
3. Open React Native Debugger or Chrome DevTools
4. In console, run:
   ```javascript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   const data = await AsyncStorage.getItem('auth_data');
   const parsed = JSON.parse(data);
   parsed.tokenValue.accessToken = 'invalid_token_xyz';
   await AsyncStorage.setItem('auth_data', JSON.stringify(parsed));
   ```
5. Try to fetch collections
6. You should see the logout flow trigger

### Method 3: Temporary Code Modification (Easiest)
Add this to `axios_instance.ts` response interceptor (temporarily):

```typescript
// Add at the start of the success response interceptor
async response => {
  // TEMPORARY: Force 401 for testing
  if (response.config.url?.includes('api/collection')) {
    const syntheticError: any = new Error('Test 401');
    syntheticError.config = response.config;
    syntheticError.response = { status: 401, data: {statusCode: 401}, config: response.config };
    return Promise.reject(syntheticError);
  }
  // ... rest of the code
}
```

Then try to fetch collections - it should trigger logout immediately.

## Expected Console Logs (When Working Correctly)

When 401 logout flow triggers, you should see:
```
[Axios] Detected 401 in response body: {bodyStatus: 401, bodyMessage: undefined, url: "..."}
[Axios] Refresh failed, logging out user...
[Axios] Auth data cleared after refresh failure
[Axios] Got auth context after refresh failure: exists
[Axios] Calling setAuth to trigger re-authentication...
[AuthProvider] setAuth called - triggering auth recheck
[AuthProvider] checkAuth starting...
[AuthProvider] No token found - setting authenticated to false
[AuthProvider] Auth state changed: {isAuthenticated: false, loading: false, refreshing: false}
```

## Troubleshooting

### If logout still doesn't work:

1. **Check if `AuthProvider` is wrapping the app correctly**
   - Verify in `App.tsx` that `<AuthProvider>` wraps `<NavigationContainer>`

2. **Check if navigation setup is correct**
   - Verify `AppNavigator` returns `AuthNavigator` when `isAuthenticated === false`

3. **Check console logs**
   - Look for "[Axios] setAuth not available in context!" - this means context isn't set up
   - Look for "[AuthProvider] No token found" - this confirms token was cleared
   - Look for "[AuthProvider] Auth state changed: {isAuthenticated: false}" - this confirms state updated

4. **React Native cache issue**
   - Clear cache and rebuild:
     ```bash
     npm start -- --reset-cache
     ```

5. **AsyncStorage not clearing**
   - Check if `storeAsyncData` function properly clears data when passed `null`

## Success Criteria

✅ When token expires and API returns 401:
- Console shows logout flow logs
- Toast message appears: "Session expired. Please log in again."
- App redirects to sign-in screen
- AsyncStorage `auth_data` is cleared
- No error thrown to user (graceful handling)

## Removing Debug Logs (Production)

Once verified working, you can remove the `console.log` statements added for debugging:
- In `authProvider.tsx`: Lines with `[AuthProvider]` prefix
- In `axios_instance.ts`: Lines with `[Axios]` prefix

Or keep them but use a debug flag to conditionally log only in development.
