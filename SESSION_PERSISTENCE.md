# Session Persistence - Implementation & Testing

## Overview

The app now implements **persistent authentication sessions** using Firebase Auth's `browserLocalPersistence`. Users will stay logged in across browser sessions, page refreshes, and device restarts until they explicitly log out.

## Implementation Details

### 1. Firebase Auth Persistence Configuration

**File:** `src/integrations/firebase/config.ts`

```typescript
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// Set auth persistence to LOCAL - users stay logged in even after browser close
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});
```

**What this does:**
- Stores authentication token in browser's `localStorage`
- Token persists even when browser is closed
- Token is automatically restored when user reopens the app
- Session remains active until explicit logout or token expiration

### 2. Auth State Listener

**Files:**
- `src/hooks/useAuth.tsx`
- `src/hooks/useFirebaseAuth.tsx`

```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }
  );
  return () => unsubscribe();
}, []);
```

**What this does:**
- Listens for authentication state changes
- Automatically restores user session from localStorage on app load
- Updates UI when user logs in or out
- Runs once when component mounts

### 3. Protected Routes

**File:** `src/pages/Index.tsx`

```typescript
const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Dashboard />;
};
```

**What this does:**
- Checks if user is authenticated before showing dashboard
- Redirects unauthenticated users to login page
- Shows loading state while checking auth status

### 4. Auth Page Redirect

**File:** `src/pages/Auth.tsx`

```typescript
useEffect(() => {
  if (!authLoading && user) {
    navigate("/", { replace: true });
  }
}, [authLoading, user, navigate]);
```

**What this does:**
- Redirects authenticated users away from login page
- Prevents logged-in users from seeing the auth page

## Persistence Modes Comparison

| Mode | Description | Use Case |
|------|-------------|----------|
| `browserLocalPersistence` | Persists across browser sessions (IMPLEMENTED) | Most web apps - users stay logged in |
| `browserSessionPersistence` | Cleared when tab is closed | Banking apps - logout on tab close |
| `inMemoryPersistence` | Cleared on page refresh | High-security apps |

**We use:** `browserLocalPersistence` for the best user experience.

## How It Works - User Flow

### First-Time Login:
1. User enters phone number and receives OTP
2. User verifies OTP successfully
3. Firebase creates authentication token
4. Token is stored in `localStorage`
5. User is redirected to dashboard

### Returning User (Browser Reopened):
1. User opens the app
2. `onAuthStateChanged` listener fires
3. Firebase checks `localStorage` for valid token
4. Token found and valid → User object restored
5. User is automatically logged in
6. Dashboard loads without requiring login

### Page Refresh:
1. Page reloads
2. React app restarts
3. `onAuthStateChanged` fires during initialization
4. User session restored from `localStorage`
5. No login required

### Explicit Logout:
1. User clicks "Log out" button
2. `signOut()` function called
3. Firebase deletes token from `localStorage`
4. `onAuthStateChanged` fires with `null` user
5. User redirected to `/auth`

## Storage Location

Authentication data is stored in browser's `localStorage`:

```
Key: firebase:authUser:[API_KEY]:[APP_NAME]
Value: {
  uid: "user-id",
  phoneNumber: "+919876543210",
  displayName: "User Name",
  stsTokenManager: {
    accessToken: "...",
    refreshToken: "...",
    expirationTime: 1234567890
  }
}
```

**Security:**
- Tokens are signed and encrypted by Firebase
- Cannot be tampered with
- Automatically refreshed before expiration
- Cleared only on logout or manual clearing

## Testing Session Persistence

### Test 1: Page Refresh
1. ✅ Log in with phone OTP
2. ✅ Navigate to dashboard
3. ✅ Refresh the page (F5 or Cmd+R)
4. **Expected:** User remains logged in, dashboard loads

### Test 2: Browser Close/Reopen
1. ✅ Log in with phone OTP
2. ✅ Close the browser completely (not just tab)
3. ✅ Reopen browser
4. ✅ Navigate to http://localhost:8080
5. **Expected:** User is automatically logged in, dashboard loads

### Test 3: New Tab
1. ✅ Log in with phone OTP in Tab 1
2. ✅ Open new tab (Tab 2)
3. ✅ Navigate to http://localhost:8080 in Tab 2
4. **Expected:** User is already logged in in Tab 2

### Test 4: Multiple Days
1. ✅ Log in with phone OTP
2. ✅ Close browser
3. ✅ Wait 24+ hours
4. ✅ Reopen and visit app
5. **Expected:** User is still logged in (token auto-refreshes)

### Test 5: Explicit Logout
1. ✅ Log in with phone OTP
2. ✅ Click "Log out" button
3. ✅ Refresh the page
4. **Expected:** User is redirected to login page

### Test 6: Incognito/Private Mode
1. ✅ Open incognito/private browser window
2. ✅ Log in with phone OTP
3. ✅ Close incognito window
4. ✅ Reopen incognito and visit app
5. **Expected:** User is logged out (incognito doesn't persist storage)

## Debugging Session Issues

### Check localStorage
Open browser console and run:
```javascript
// Check if auth token exists
localStorage.getItem('firebase:authUser:[API_KEY]:[APP_NAME]');

// List all localStorage keys
Object.keys(localStorage);
```

### Check Auth State
In browser console:
```javascript
// Current auth state
auth.currentUser;

// Listen to auth changes
onAuthStateChanged(auth, (user) => {
  console.log('Auth state:', user);
});
```

### Common Issues

#### Issue: User logged out after refresh
**Possible Causes:**
- Browser blocking localStorage
- Incognito mode
- Browser extension clearing storage
- Token expired (rare)

**Solution:**
- Check browser settings allow localStorage
- Don't use incognito for persistent sessions
- Disable storage-clearing extensions

#### Issue: User not automatically logged in
**Possible Causes:**
- `onAuthStateChanged` not set up correctly
- React component unmounting too early
- Loading state not handled

**Solution:**
- Verify auth listeners in hooks
- Check console for errors
- Ensure loading state is shown

#### Issue: Session expires unexpectedly
**Possible Causes:**
- Token expired (Firebase handles this automatically)
- Firebase service account issues
- Network issues preventing token refresh

**Solution:**
- Check Firebase Console for service status
- Verify network connectivity
- Check browser console for errors

## Token Refresh

Firebase automatically refreshes tokens:
- Access tokens expire after **1 hour**
- Refresh tokens are long-lived (no expiration)
- Firebase SDK auto-refreshes before expiration
- No action needed from developers

## Security Considerations

### Storage Security
- Tokens stored in localStorage (XSS risk if not careful)
- Always sanitize user input
- Use Content Security Policy (CSP)
- Don't expose sensitive data in client code

### Token Security
- Tokens are signed and encrypted
- Cannot be forged or modified
- Validated on every Firebase request
- Automatically revoked on logout

### Best Practices
✅ We implement:
- Secure token storage (Firebase handles this)
- Auto token refresh
- Explicit logout functionality
- Protected routes with auth guards
- Auth state listeners

❌ Avoid:
- Storing tokens manually
- Implementing custom token refresh
- Allowing authenticated actions without checking auth state

## Monitoring & Analytics

You can track session persistence in Firebase Console:

1. **Authentication → Users**
   - See last sign-in time
   - Track active users

2. **Authentication → Usage**
   - Monitor authentication attempts
   - Track SMS usage (10/day on free tier)

3. **Firestore → Usage**
   - Monitor read/write operations
   - Track active sessions

## Migration from Email/Password

Previous implementation had similar session persistence, but now:
- ✅ Uses phone numbers instead of email
- ✅ OTP verification instead of passwords
- ✅ Same persistence behavior
- ✅ Token storage in same location

## Troubleshooting Checklist

When testing session persistence, verify:

- [ ] Firebase config includes all required fields
- [ ] `setPersistence` is called successfully
- [ ] `onAuthStateChanged` listeners are set up
- [ ] Protected routes check auth state
- [ ] Loading states are handled properly
- [ ] Logout clears localStorage
- [ ] Browser allows localStorage
- [ ] No browser extensions interfere
- [ ] Console shows no errors

## Summary

✅ **Session Persistence is Fully Implemented:**
- Users stay logged in across browser sessions
- Automatic session restoration on app load
- Token auto-refresh before expiration
- Explicit logout when user wants to sign out
- Secure token storage in localStorage
- Works on all modern browsers

**Your users can now:**
- Log in once and stay logged in
- Close and reopen browser without re-login
- Refresh page without losing session
- Only need to login again when they explicitly log out

**Test it now at:** http://localhost:8080
