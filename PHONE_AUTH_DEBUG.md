# Phone Authentication Error - Debugging Guide

## Current Error: "Failed to send OTP. Please try again"

This error typically occurs due to one of these reasons:

## Most Likely Cause: Unauthorized Domain

Firebase Phone Authentication requires the domain to be whitelisted in Firebase Console.

### Fix: Add localhost to Authorized Domains

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/two-track-teller-1770026581/authentication/settings

2. **Click on "Settings" tab in Authentication**

3. **Scroll to "Authorized domains" section**

4. **Click "Add domain"**

5. **Add:** `localhost`

6. **Save changes**

7. **Retry in your app**

## Other Possible Causes

### 1. Phone Number Not Configured for Testing

If you're using a test phone number without actual SMS:

1. Go to: https://console.firebase.google.com/project/two-track-teller-1770026581/authentication/providers

2. Click on "Phone" provider

3. Scroll to "Phone numbers for testing"

4. Add your phone: `+918368561022`

5. Add test code: `123456` (or any 6-digit code)

6. Save

**Then in app:** Use the test code `123456` instead of waiting for SMS

### 2. reCAPTCHA Site Key Issue

Check browser console (F12) for detailed error. Look for:
- `auth/invalid-app-credential`
- `auth/app-not-authorized`
- `auth/captcha-check-failed`

### 3. API Key Restrictions

If API key has restrictions:

1. Go to: https://console.cloud.google.com/apis/credentials?project=two-track-teller-1770026581

2. Click on your API key

3. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add: `http://localhost:*`
   - Add: `http://127.0.0.1:*`

4. Save

## Quick Diagnostic Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) → Console tab

Look for the actual Firebase error. It will show something like:
```
FirebaseError: Firebase: Error (auth/unauthorized-domain).
```

**Send me the exact error message from console!**

### Step 2: Verify Phone Auth is Enabled

1. Go to: https://console.firebase.google.com/project/two-track-teller-1770026581/authentication/providers

2. Ensure "Phone" shows "Enabled" status (green checkmark)

### Step 3: Test with Test Phone Number

Instead of real SMS, use a test number:

1. Add test phone in Firebase Console
2. Use test code instead of real SMS
3. This bypasses SMS quota and delivery issues

## Temporary Workaround: Use Test Phone Numbers

**In Firebase Console:**
1. Authentication → Sign-in method → Phone
2. Add test number: `+918368561022` with code `123456`
3. In your app, enter: `8368561022`
4. Click Send OTP (no SMS will be sent)
5. Enter OTP: `123456`
6. Should log in successfully

This confirms if the issue is with:
- SMS delivery ❌
- Firebase configuration ✅

## Complete Fix Checklist

Run through this checklist:

- [ ] Phone authentication enabled in Firebase Console
- [ ] `localhost` added to Authorized domains
- [ ] API key allows localhost/HTTP referrers
- [ ] Phone number format: 10 digits (e.g., `8368561022`)
- [ ] Browser console checked for specific error
- [ ] Test phone number configured (optional but helpful)
- [ ] Firebase project has SMS quota available
- [ ] No browser extensions blocking requests

## Commands to Help Debug

### Check if dev server is accessible
```bash
curl http://localhost:8080
```

### Check Firebase config is loaded
Open browser console and run:
```javascript
console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID);
// Should show: two-track-teller-1770026581
```

### Check auth instance
```javascript
console.log(auth);
// Should show Firebase auth object
```

## Next Steps

**IMMEDIATE ACTION:** Please do the following and tell me the results:

1. **Open Browser Console (F12)**
   - Go to Console tab
   - Try sending OTP again
   - Copy the EXACT error message
   - Share it with me

2. **Add localhost to Authorized Domains**
   - Follow steps above
   - This is most likely the fix

3. **(Optional) Add Test Phone Number**
   - This helps bypass SMS issues
   - Use test code instead of real SMS

## Expected Console Error

You should see one of these errors in console:

### If it's unauthorized domain:
```
FirebaseError: Firebase: Error (auth/unauthorized-domain).
Domain not whitelisted by project
```
**Fix:** Add localhost to authorized domains

### If it's API key restriction:
```
FirebaseError: Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key).
```
**Fix:** Update API key restrictions

### If it's reCAPTCHA:
```
reCAPTCHA client element has been removed
```
**Fix:** Already implemented in previous fix

### If it's phone format:
```
FirebaseError: Firebase: Error (auth/invalid-phone-number).
```
**Fix:** Ensure number is `+918368561022` format

## Contact Info

Once you check the console and tell me the exact error, I can provide a more specific fix!

**Most likely it's just the authorized domain issue - add `localhost` and retry!**
