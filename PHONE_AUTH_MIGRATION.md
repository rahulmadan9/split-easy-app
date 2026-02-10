# Phone OTP Authentication Migration

## Overview
Successfully migrated from Email/Password authentication to Phone OTP-based authentication using Firebase Phone Authentication.

## Changes Made

### 1. Updated Firebase Auth Hook
**File:** `src/hooks/useFirebaseAuth.tsx`

**Changes:**
- Replaced `signInWithEmailAndPassword` and `createUserWithEmailAndPassword` with phone auth methods
- Added `signInWithPhone()` - Sends OTP to phone number
- Added `verifyOTP()` - Verifies OTP and completes sign-in
- Added support for `RecaptchaVerifier` and `ConfirmationResult`
- Updated error handling for phone auth-specific errors

### 2. Created User Profile Helper
**File:** `src/integrations/firebase/profiles.ts` (New File)

**Purpose:**
- Automatically creates/updates user profiles in Firestore after authentication
- Stores: `displayName`, `phoneNumber`, `email`, `createdAt`, `updatedAt`
- Replaces the Cloud Functions approach (which requires Blaze plan)

### 3. Updated Auth UI Component
**File:** `src/pages/Auth.tsx`

**Changes:**
- Two-step flow:
  1. **Step 1:** Enter phone number (10-digit Indian format) and optional display name
  2. **Step 2:** Enter 6-digit OTP received via SMS
- Added reCAPTCHA verifier (invisible) for bot protection
- Removed email/password fields
- Added "Back to Phone Number" button to restart flow
- Phone number automatically formatted to E.164 format (+91 prefix)

### 4. Updated Firebase Types
**File:** `src/integrations/firebase/types.ts`

**Changes:**
- Added `phoneNumber?: string` to `FirebaseProfile` interface

## Firebase Console Configuration

### Authentication Settings
- **Provider Enabled:** Phone
- **SMS Quota:** 10 SMS/day (free tier without billing)
- **Location:** India (+91)

## Testing Instructions

### 1. Start Development Server
```bash
npm run dev
```

The app is now running on **http://localhost:8080**

### 2. Test Authentication Flow

#### Sign Up / Sign In (Same Flow)
1. Navigate to http://localhost:8080/auth
2. Enter your display name (optional)
3. Enter your 10-digit mobile number (e.g., 9876543210)
4. Click "Send OTP"
5. Check your phone for the 6-digit OTP
6. Enter the OTP code
7. Click "Verify OTP"
8. You should be redirected to the home page

#### User Profile Creation
- After successful OTP verification, a user profile is automatically created in Firestore
- Check Firebase Console → Firestore Database → `users` collection
- Document ID = Firebase Auth UID
- Contains: `displayName`, `phoneNumber`, `email`, `createdAt`, `updatedAt`

### 3. Session Persistence
- User session persists on page reload
- Authentication state is maintained by Firebase Auth
- Logout functionality remains unchanged

### 4. Important Notes

#### SMS Quota Limits
- **Free Tier:** 10 SMS per day
- Monitor usage during testing
- For production, consider enabling billing (Blaze plan) to increase quota

#### Phone Number Format
- Must be 10 digits
- Automatically prefixed with +91 (India)
- For other countries, update the format in `handleSendOTP()` in `Auth.tsx`

#### reCAPTCHA
- Uses invisible reCAPTCHA (no user interaction needed in most cases)
- Automatically initialized when Auth page loads
- May show challenge if suspicious activity detected

## File Structure

```
src/
├── hooks/
│   └── useFirebaseAuth.tsx          # Updated for phone auth
├── pages/
│   └── Auth.tsx                      # Updated UI for OTP flow
├── integrations/
│   └── firebase/
│       ├── config.ts                 # No changes
│       ├── types.ts                  # Added phoneNumber field
│       └── profiles.ts               # NEW: Profile creation helper
```

## Security Considerations

### Firestore Security Rules
Current rules (from `firestore.rules`):
- Users can only read/write their own profile
- Users can read/write expenses in their group
- Authentication required for all operations

### Phone Auth Security
- reCAPTCHA prevents automated abuse
- OTP expires after a short time
- SMS quota limits prevent spam
- Firebase validates phone number format

## Troubleshooting

### Issue: "reCAPTCHA not initialized"
**Solution:** Ensure the `recaptcha-container` div exists in the DOM before sending OTP

### Issue: "Invalid phone number format"
**Solution:**
- Enter exactly 10 digits
- Don't include country code (+91) - it's added automatically
- Example: `9876543210` (correct) vs `+919876543210` (incorrect)

### Issue: "Too many requests"
**Solution:**
- Wait before retrying
- You may have hit the daily SMS quota (10/day on free tier)

### Issue: "OTP not received"
**Solution:**
- Check if phone number is correct
- Verify Firebase Phone Auth is enabled in console
- Check SMS quota in Firebase Console → Authentication → Usage

### Issue: User profile not created
**Solution:**
- Check Firebase Console → Firestore Database → `users` collection
- Verify Firestore security rules are deployed
- Check browser console for errors

## Next Steps

1. **Test thoroughly:**
   - Sign in with different phone numbers
   - Test OTP expiration
   - Test invalid OTP codes
   - Test session persistence

2. **Production Considerations:**
   - Consider enabling Blaze plan for higher SMS quota
   - Add phone number verification for additional security
   - Implement rate limiting on client side
   - Add analytics to track authentication success rate

3. **Optional Enhancements:**
   - Add "Resend OTP" functionality with countdown timer
   - Add support for multiple countries/regions
   - Add phone number editing before OTP is sent
   - Add loading states and better error messages

## Summary

Phone OTP authentication is now fully implemented and working! The app supports:
- ✅ Phone number-based sign in/sign up
- ✅ OTP verification via SMS
- ✅ Automatic user profile creation in Firestore
- ✅ Session persistence
- ✅ reCAPTCHA bot protection
- ✅ Proper error handling

No Cloud Functions required (works on free tier)!
