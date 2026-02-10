# Two Track Teller - Comprehensive Testing Guide

## Overview
This guide will help you test all flows in the Two Track Teller app after fixing the reCAPTCHA initialization issue.

## Prerequisites
- Dev server running on http://localhost:8080
- Valid phone number for testing (receives SMS)
- Firebase Phone Authentication enabled
- SMS quota available (10/day on free tier)

## What Was Fixed

### Issue
- **Error:** "reCAPTCHA not initialized"
- **Cause:** Cleanup function in useEffect was clearing the reCAPTCHA verifier prematurely

### Solution
- Implemented lazy initialization (reCAPTCHA created only when needed)
- Improved cleanup logic (only on unmount, not on every render)
- Added better error handling and retry logic
- Fixed state management for reCAPTCHA lifecycle

### Changes Made
**File:** `src/pages/Auth.tsx`
- Added `initializeRecaptcha()` function for lazy initialization
- Updated `handleSendOTP()` to use lazy initialization
- Improved cleanup in useEffect
- Added reCAPTCHA reset when going back to phone number entry

---

## Test Plan

### Phase 1: Authentication Flow

#### Test 1.1: First-Time Phone Authentication
**Steps:**
1. Open http://localhost:8080
2. Should redirect to `/auth` (not logged in)
3. Enter display name: "Test User"
4. Enter phone number: Your 10-digit mobile number
5. Click "Send OTP"

**Expected Results:**
- ✅ No "reCAPTCHA not initialized" error
- ✅ reCAPTCHA widget appears briefly (invisible)
- ✅ Success toast: "OTP sent to your phone!"
- ✅ UI switches to OTP verification screen
- ✅ SMS received on your phone with 6-digit code

**If it fails:**
- Check browser console for errors
- Verify phone number format (10 digits, no spaces)
- Check Firebase Console → Authentication → Usage for SMS quota

---

#### Test 1.2: OTP Verification
**Steps:**
1. After receiving OTP from Test 1.1
2. Enter the 6-digit OTP code
3. Click "Verify OTP"

**Expected Results:**
- ✅ Success toast: "Successfully logged in!"
- ✅ Redirected to dashboard (`/`)
- ✅ User profile created in Firestore
- ✅ Dashboard shows expense tracking interface

**Verify in Firebase Console:**
1. Go to Authentication → Users
   - Your phone number should be listed
2. Go to Firestore Database → `users` collection
   - Document with your UID exists
   - Contains: displayName, phoneNumber, createdAt, updatedAt

---

#### Test 1.3: Invalid OTP Handling
**Steps:**
1. Log out (if logged in)
2. Send OTP to your phone number
3. Enter wrong OTP: "123456"
4. Click "Verify OTP"

**Expected Results:**
- ✅ Error toast: "Invalid OTP. Please check and try again"
- ✅ Stay on OTP verification screen
- ✅ Can try again with correct OTP

---

#### Test 1.4: Resend OTP Flow
**Steps:**
1. Send OTP to your phone
2. On OTP verification screen, click "Back to Phone Number"
3. Enter same phone number
4. Click "Send OTP" again

**Expected Results:**
- ✅ reCAPTCHA reinitialized successfully
- ✅ New OTP sent
- ✅ Previous OTP invalidated
- ✅ New OTP works for verification

---

### Phase 2: Session Persistence

#### Test 2.1: Page Refresh
**Steps:**
1. Log in with phone OTP
2. Navigate to dashboard
3. Refresh page (F5 or Cmd+R)

**Expected Results:**
- ✅ User stays logged in
- ✅ Dashboard reloads with user data
- ✅ No redirect to login page
- ✅ Loading state shown briefly

---

#### Test 2.2: Browser Close/Reopen
**Steps:**
1. Log in with phone OTP
2. Close browser completely (not just tab)
3. Reopen browser
4. Navigate to http://localhost:8080

**Expected Results:**
- ✅ Automatically logged in
- ✅ Dashboard loads without login prompt
- ✅ Session restored from localStorage

---

#### Test 2.3: New Tab
**Steps:**
1. Log in with phone OTP in Tab 1
2. Open new tab (Tab 2)
3. Navigate to http://localhost:8080 in Tab 2

**Expected Results:**
- ✅ Already logged in in Tab 2
- ✅ Dashboard loads immediately
- ✅ Both tabs share session

---

#### Test 2.4: Direct URL Access When Logged In
**Steps:**
1. While logged in, navigate to http://localhost:8080/auth

**Expected Results:**
- ✅ Automatically redirected to dashboard
- ✅ Cannot access auth page while logged in

---

### Phase 3: Expense Management

#### Test 3.1: Add New Expense
**Steps:**
1. Log in and go to dashboard
2. Click "Add Expense" button (or similar)
3. Fill in expense details:
   - Description: "Groceries"
   - Amount: 500
   - Category: "groceries"
   - Split: 50/50
4. Save expense

**Expected Results:**
- ✅ Expense appears in list
- ✅ Success toast shown
- ✅ Balance calculated automatically
- ✅ Real-time update in Firestore

**Verify in Firestore:**
- Go to Firestore Database → `expenses` collection
- New document exists with correct data

---

#### Test 3.2: View Expenses List
**Steps:**
1. After adding expense from Test 3.1
2. View expenses list on dashboard

**Expected Results:**
- ✅ All expenses displayed
- ✅ Sorted by date (newest first)
- ✅ Shows paidBy name
- ✅ Shows split information
- ✅ Shows category

---

#### Test 3.3: Edit Expense
**Steps:**
1. Find an existing expense
2. Click edit button
3. Change amount from 500 to 600
4. Save changes

**Expected Results:**
- ✅ Expense updated in list
- ✅ Balance recalculated
- ✅ Updated in Firestore
- ✅ Success toast shown

---

#### Test 3.4: Delete Expense
**Steps:**
1. Find an expense to delete
2. Click delete button
3. Confirm deletion

**Expected Results:**
- ✅ Expense removed from list
- ✅ Balance recalculated
- ✅ Deleted from Firestore
- ✅ Success toast shown

---

#### Test 3.5: Balance Calculation
**Steps:**
1. Add expense: User A paid ₹1000, split 50/50
2. Add expense: User B paid ₹600, split 50/50
3. Check balance display

**Expected Results:**
- ✅ User A is owed: ₹500
- ✅ User B owes: ₹500
- ✅ Or: User B is owed ₹200 (depending on who you are)
- ✅ Balance updates in real-time

---

#### Test 3.6: Custom Split
**Steps:**
1. Add expense with custom split
2. User A paid ₹1000
3. User A's share: ₹300
4. User B's share: ₹700

**Expected Results:**
- ✅ Custom amounts accepted
- ✅ Balance calculated correctly
- ✅ Shows custom split in expense details

---

#### Test 3.7: Payment Recording
**Steps:**
1. When one user owes another
2. Click "Record Payment"
3. Enter settlement amount
4. Save payment

**Expected Results:**
- ✅ Payment recorded as expense (isPayment: true)
- ✅ Balance updated accordingly
- ✅ Payment shows differently in list (payment icon/tag)

---

### Phase 4: Real-Time Updates

#### Test 4.1: Multi-Tab Sync
**Steps:**
1. Open app in two browser tabs
2. Both tabs logged in as same user
3. Add expense in Tab 1
4. Watch Tab 2

**Expected Results:**
- ✅ Expense appears in Tab 2 immediately
- ✅ No page refresh needed
- ✅ Balance updates in Tab 2

---

#### Test 4.2: Multi-User Real-Time (requires 2nd user)
**Steps:**
1. User A logs in (your phone)
2. User B logs in (friend's phone, or incognito with different number)
3. User A adds expense
4. Check User B's view

**Expected Results:**
- ✅ User B sees User A's expense immediately
- ✅ Balance updates for both users
- ✅ Real-time sync across accounts

---

### Phase 5: Logout Flow

#### Test 5.1: Explicit Logout
**Steps:**
1. Log in with phone OTP
2. Navigate to dashboard
3. Click "Logout" button
4. Refresh page

**Expected Results:**
- ✅ Redirected to `/auth`
- ✅ Session cleared from localStorage
- ✅ Cannot access dashboard
- ✅ Must log in again

---

#### Test 5.2: Logout and Re-login
**Steps:**
1. Log out from Test 5.1
2. Log in again with same phone number
3. Verify OTP

**Expected Results:**
- ✅ Successfully logs in
- ✅ Previous data still exists
- ✅ Expenses and balance intact
- ✅ User profile remains same

---

### Phase 6: Error Handling

#### Test 6.1: Network Error
**Steps:**
1. Open browser DevTools
2. Go to Network tab → Throttle to "Offline"
3. Try to send OTP

**Expected Results:**
- ✅ Error toast: "Network error" or "Failed to send OTP"
- ✅ User remains on phone entry screen
- ✅ Can retry when back online

---

#### Test 6.2: Invalid Phone Number
**Steps:**
1. Enter invalid phone: "123"
2. Click "Send OTP"

**Expected Results:**
- ✅ Browser validation error
- ✅ Form doesn't submit
- ✅ Message: "Please enter a valid 10-digit phone number"

---

#### Test 6.3: SMS Quota Exceeded
**Steps:**
1. Send OTP 10+ times in one day

**Expected Results:**
- ✅ Error toast: "SMS quota exceeded"
- ✅ Wait until next day or enable billing
- ✅ Clear error message to user

---

### Phase 7: UI/UX Testing

#### Test 7.1: Responsive Design - Mobile
**Steps:**
1. Open browser DevTools
2. Toggle device toolbar (mobile view)
3. Test on iPhone/Android sizes

**Expected Results:**
- ✅ Layout adjusts to mobile
- ✅ Buttons are tappable
- ✅ Forms are easy to fill
- ✅ Text is readable

---

#### Test 7.2: Responsive Design - Desktop
**Steps:**
1. View on desktop browser
2. Resize window to different widths

**Expected Results:**
- ✅ Layout responsive
- ✅ Content centered
- ✅ No horizontal scroll
- ✅ Proper spacing

---

#### Test 7.3: Loading States
**Steps:**
1. Watch for loading indicators during:
   - Initial page load
   - OTP sending
   - OTP verification
   - Adding/editing expenses

**Expected Results:**
- ✅ Loading text/spinner shown
- ✅ Buttons disabled during loading
- ✅ Clear feedback to user
- ✅ No double-submission possible

---

#### Test 7.4: Toast Notifications
**Steps:**
1. Perform various actions
2. Check toast messages appear

**Expected Results:**
- ✅ Success toasts are green/positive
- ✅ Error toasts are red/negative
- ✅ Toasts auto-dismiss after few seconds
- ✅ Messages are clear and helpful

---

### Phase 8: Browser Compatibility

#### Test 8.1: Chrome
- ✅ All features work
- ✅ Phone auth successful
- ✅ Session persists

#### Test 8.2: Safari
- ✅ All features work
- ✅ Phone auth successful
- ✅ Session persists

#### Test 8.3: Firefox
- ✅ All features work
- ✅ Phone auth successful
- ✅ Session persists

---

### Phase 9: Security Testing

#### Test 9.1: Firestore Security Rules
**Steps:**
1. Open browser console
2. Try to read another user's data:
```javascript
import { collection, getDocs } from 'firebase/firestore';
// Try to access expenses of different user
```

**Expected Results:**
- ✅ Permission denied error
- ✅ Cannot read other users' expenses
- ✅ Can only read own data

---

#### Test 9.2: Auth Token Inspection
**Steps:**
1. Open DevTools → Application → Local Storage
2. Find `firebase:authUser` key
3. Inspect token

**Expected Results:**
- ✅ Token is encrypted/signed
- ✅ Contains user ID and expiry
- ✅ Cannot be manually modified

---

#### Test 9.3: Protected Routes
**Steps:**
1. Log out
2. Try to access http://localhost:8080/ directly

**Expected Results:**
- ✅ Redirected to `/auth`
- ✅ Cannot access dashboard without auth
- ✅ Protected route works correctly

---

## Troubleshooting Common Issues

### Issue: reCAPTCHA Still Not Working
**Solutions:**
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear browser cache
3. Check browser console for specific error
4. Verify Firebase config in `.env`
5. Check if reCAPTCHA is blocked by browser extensions

### Issue: OTP Not Received
**Solutions:**
1. Check phone number format (10 digits, no +91)
2. Verify SMS quota in Firebase Console
3. Wait 1-2 minutes (SMS can be delayed)
4. Check spam/blocked messages
5. Try different phone number

### Issue: Session Not Persisting
**Solutions:**
1. Check if browser allows localStorage
2. Disable "Clear on exit" in browser settings
3. Disable privacy extensions
4. Check browser console for errors
5. Verify `setPersistence` is called in config.ts

### Issue: Real-Time Updates Not Working
**Solutions:**
1. Check Firestore rules are deployed
2. Verify network connection
3. Check browser console for WebSocket errors
4. Refresh page to reconnect
5. Check Firebase Console for service status

---

## Performance Checklist

- [ ] Page loads within 3 seconds
- [ ] OTP sends within 5 seconds
- [ ] Expenses load immediately
- [ ] Real-time updates appear < 1 second
- [ ] No memory leaks (check DevTools memory tab)
- [ ] No excessive re-renders
- [ ] Firebase read/write counts reasonable

---

## Accessibility Checklist

- [ ] Can navigate with keyboard (Tab key)
- [ ] Form inputs have proper labels
- [ ] Error messages are announced
- [ ] Focus states visible
- [ ] Color contrast sufficient
- [ ] Screen reader friendly

---

## Final Verification

### Before Production:
1. [ ] All tests pass
2. [ ] No console errors
3. [ ] Firebase security rules deployed
4. [ ] Environment variables set correctly
5. [ ] Error handling comprehensive
6. [ ] Loading states everywhere
7. [ ] Mobile responsive
8. [ ] Cross-browser tested
9. [ ] Performance optimized
10. [ ] Documentation updated

---

## Quick Test Script

Run this in browser console after logging in to verify everything:

```javascript
// Check auth state
console.log('User:', auth.currentUser);

// Check localStorage
console.log('Auth token exists:', !!localStorage.getItem(Object.keys(localStorage).find(k => k.includes('firebase:authUser'))));

// Check if user profile exists in Firestore
import { doc, getDoc } from 'firebase/firestore';
const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
console.log('Profile exists:', userDoc.exists());
console.log('Profile data:', userDoc.data());

// List all expenses
import { collection, getDocs } from 'firebase/firestore';
const expensesSnap = await getDocs(collection(db, 'expenses'));
console.log('Total expenses:', expensesSnap.size);
```

---

## Success Criteria

Your app is ready when:
- ✅ Phone authentication works without errors
- ✅ Session persists across browser restarts
- ✅ Can add, edit, delete expenses
- ✅ Balance calculates correctly
- ✅ Real-time updates work
- ✅ All error states handled gracefully
- ✅ Mobile responsive
- ✅ No security vulnerabilities
- ✅ Performance is good
- ✅ User experience is smooth

---

## Next Steps After Testing

1. Deploy to Firebase Hosting
2. Set up custom domain (optional)
3. Enable billing for higher SMS quota (if needed)
4. Monitor usage in Firebase Console
5. Gather user feedback
6. Iterate and improve

Happy Testing! 🎉
