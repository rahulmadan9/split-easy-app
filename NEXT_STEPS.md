# Next Steps: Deploy Your Firebase Migration

## Migration Status: ✅ Code Complete

The Supabase to Firebase migration is **code complete**. All hooks and components have been updated to use Firebase instead of Supabase.

## What's Been Done

✅ Firebase SDK installed
✅ Firebase configuration files created
✅ Cloud Functions project set up
✅ Firestore security rules created
✅ All hooks migrated to Firebase (useAuth, useProfiles, useExpenses)
✅ All components updated to use Firebase
✅ Supabase dependencies removed
✅ Type definitions updated

## What You Need to Do

### Step 1: Create Firebase Project (Required)

You must create a Firebase project and configure it before the app will work.

**Follow the complete guide:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

Quick summary:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Email/Password authentication
4. Create Firestore database
5. Get your Firebase config credentials

### Step 2: Configure Environment Variables (Required)

Update your `.env` file with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY="your-actual-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

### Step 3: Deploy Cloud Functions (Required)

```bash
# Login to Firebase
firebase login

# Deploy the user profile creation function
firebase deploy --only functions
```

This function automatically creates user profiles when new users sign up.

### Step 4: Deploy Security Rules (Required)

```bash
firebase deploy --only firestore:rules
```

This protects your database with proper access controls.

### Step 5: Test Locally (Recommended)

#### Option A: With Firebase Emulators (Recommended for Testing)

```bash
# Terminal 1: Start Firebase Emulators
firebase emulators:start

# Terminal 2: Start dev server
VITE_USE_FIREBASE_EMULATORS=true npm run dev
```

Open http://localhost:5173 and http://localhost:4000 (Emulator UI)

#### Option B: With Production Firebase

```bash
# Make sure VITE_USE_FIREBASE_EMULATORS=false in .env
npm run dev
```

Open http://localhost:5173

### Step 6: Test All Functionality

Use this checklist to verify everything works:

**Authentication:**
- [ ] Create a new user account
- [ ] Check Firebase Console → Authentication → Users (should see new user)
- [ ] Check Firebase Console → Firestore → users collection (profile auto-created)
- [ ] Log out
- [ ] Log back in
- [ ] Refresh page (session should persist)

**Expenses:**
- [ ] Add a new expense
- [ ] View it in the expenses list
- [ ] Edit the expense
- [ ] Delete the expense
- [ ] Add multiple expenses
- [ ] Check balance calculation

**Real-time Updates:**
- [ ] Open the app in two browser windows
- [ ] Add an expense in one window
- [ ] Verify it appears immediately in the other window

**Security:**
- [ ] Try accessing Firestore directly (should be denied without auth)
- [ ] Create two user accounts
- [ ] Verify each user only sees their own expenses

### Step 7: Deploy to Production (When Ready)

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting (optional)
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

## Important Notes

### User Migration
- **No automatic user migration** - All users must create new accounts
- Previous Supabase accounts will not work
- Users need to sign up again with Firebase

### Data Migration
- **Starting with a clean database** - No historical expenses transferred
- This is intentional per the migration plan (starting fresh)

### Supabase Cleanup
After 7 days of successful Firebase operation:
1. Remove Supabase environment variables from `.env`
2. Delete `src/integrations/supabase/` directory (optional, for complete cleanup)
3. Cancel/decommission your Supabase project

## Troubleshooting

### "Firebase not configured" error
- Make sure you've updated the `.env` file with your Firebase credentials
- Restart your dev server after changing `.env`

### "Permission denied" errors
- Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- Make sure you're logged in (check Firebase Console → Authentication)

### User profile not created automatically
- Check Firebase Console → Functions → Logs
- Make sure Cloud Function is deployed: `firebase deploy --only functions`
- **Important:** Cloud Functions require billing enabled (but free tier is generous)

### Real-time updates not working
- Check browser console for errors
- Make sure Firestore security rules are deployed
- Verify you're authenticated

## Getting Help

- **Setup Guide:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Migration Summary:** [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
- **Firebase Docs:** https://firebase.google.com/docs

## Quick Start Commands

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Update your .firebaserc with your project ID
# Edit .firebaserc and replace "your-project-id-here"

# Deploy functions and rules
firebase deploy --only functions,firestore:rules

# Start development
npm run dev
```

## Current File Structure

```
two-track-teller/
├── src/
│   ├── integrations/
│   │   ├── firebase/          # ✅ New Firebase integration
│   │   │   ├── config.ts      # Firebase initialization
│   │   │   └── types.ts       # TypeScript types
│   │   └── supabase/          # ⚠️ Legacy - can be deleted after verification
│   │       ├── client.ts
│   │       └── types.ts
│   ├── hooks/
│   │   ├── useAuth.tsx        # ✅ Updated for Firebase
│   │   ├── useProfiles.tsx    # ✅ Updated for Firebase
│   │   └── useExpenses.tsx    # ✅ Updated for Firebase
│   └── components/            # ✅ All updated for Firebase
├── functions/                 # ✅ New Cloud Functions
│   ├── src/
│   │   └── index.ts          # User profile creation function
│   ├── package.json
│   └── tsconfig.json
├── firebase.json              # ✅ Firebase configuration
├── firestore.rules            # ✅ Security rules
├── .firebaserc                # ⚠️ Update with your project ID
├── .env                       # ⚠️ Add your Firebase credentials
├── FIREBASE_SETUP.md          # 📖 Complete setup guide
├── MIGRATION_SUMMARY.md       # 📖 Migration details
└── NEXT_STEPS.md             # 📖 This file
```

## Timeline

- **Now:** Code migration complete ✅
- **Next 1-2 hours:** Firebase project setup and configuration
- **Next 1-2 days:** Testing and verification
- **After 1 week:** Clean up Supabase (if all working well)

---

**Ready to deploy?** Start with [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) 🚀
