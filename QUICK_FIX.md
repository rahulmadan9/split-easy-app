# Quick Fix for "Failed to send OTP" Error

## 🚨 IMMEDIATE FIX (Most Likely Solution)

### Problem
Firebase Phone Authentication requires the domain to be whitelisted.

### Solution: Add localhost to Authorized Domains

**Follow these steps RIGHT NOW:**

1. **Open this URL:**
   ```
   https://console.firebase.google.com/project/two-track-teller-1770026581/authentication/settings
   ```

2. **Look for "Authorized domains" section** (should be visible on the page)

3. **You should see:**
   - `two-track-teller-1770026581.firebaseapp.com` (already there)
   - Maybe some others

4. **Click "Add domain" button**

5. **Type:** `localhost`

6. **Click "Add"**

7. **Go back to your app and try again!**

---

## 🔍 Check Browser Console (Important!)

**Before adding domain, let's confirm this is the issue:**

1. **Open your browser DevTools:**
   - Press `F12` (Windows/Linux)
   - Press `Cmd + Option + I` (Mac)

2. **Go to "Console" tab**

3. **Try clicking "Send OTP" again**

4. **Look for an error message that says:**
   ```
   FirebaseError: Firebase: Error (auth/unauthorized-domain)
   ```

   OR

   ```
   auth/unauthorized-continue-uri
   ```

**If you see this error ↑ then the fix is definitely adding `localhost` to authorized domains!**

---

## Alternative: Use Test Phone Number (Bypass SMS)

If you want to test without waiting for SMS:

1. **Go to:**
   ```
   https://console.firebase.google.com/project/two-track-teller-1770026581/authentication/providers
   ```

2. **Click on "Phone"** (the row with the phone icon)

3. **Scroll down to "Phone numbers for testing"**

4. **Click "Add phone number"**

5. **Add:**
   - Phone: `+918368561022`
   - Test code: `123456`

6. **Save**

7. **In your app:**
   - Enter phone: `8368561022`
   - Click "Send OTP" (no SMS sent!)
   - Enter OTP: `123456`
   - Should work!

---

## 📋 Complete Checklist

Work through these in order:

### ✅ Step 1: Check Console Error
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for Firebase error
- [ ] Note the error code (e.g., `auth/unauthorized-domain`)

### ✅ Step 2: Add Authorized Domain
- [ ] Go to Firebase Console → Authentication → Settings
- [ ] Add `localhost` to authorized domains
- [ ] Save changes

### ✅ Step 3: Retry in App
- [ ] Refresh browser page
- [ ] Try Send OTP again
- [ ] Should work now!

### ✅ Step 4 (Optional): Add Test Number
- [ ] Add test phone number in Firebase
- [ ] Use test code instead of real SMS
- [ ] Faster testing, no SMS quota used

---

## 🎯 Expected Result After Fix

After adding `localhost`:

1. ✅ Click "Send OTP" → No error
2. ✅ See success toast: "OTP sent to your phone!"
3. ✅ Receive SMS with 6-digit code
4. ✅ Enter code and verify
5. ✅ Successfully logged in!

---

## 🆘 If Still Not Working

**Tell me the exact error from browser console:**

1. Copy the full error message from Console tab
2. Share it with me
3. I'll provide the specific fix

**Also check:**
- Is phone auth ENABLED in Firebase Console?
- Is the phone number valid? (10 digits for India)
- Are you on the right Firebase project?

---

## 📱 Quick Test Command

Open browser console and run this to verify Firebase is loaded:

```javascript
console.log('Firebase Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('Auth:', auth);
```

Should show:
```
Firebase Project: two-track-teller-1770026581
Auth: Auth {...}
```

---

## Summary

**Most likely fix:** Add `localhost` to Firebase authorized domains (2 minutes)

**Alternative:** Use test phone number (3 minutes)

**Need help?** Check browser console and share the error message!

**Start here:** https://console.firebase.google.com/project/two-track-teller-1770026581/authentication/settings
