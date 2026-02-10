# Firebase Setup Guide

This guide will walk you through setting up Firebase for your expense-splitting app migration from Supabase.

## Prerequisites

- Node.js and npm installed
- A Google account for Firebase Console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "two-track-teller" or "expense-splitter")
4. Click "Continue"
5. (Optional) Enable Google Analytics if desired
6. Click "Create project"
7. Wait for project creation to complete

## Step 2: Register Your Web App

1. In the Firebase Console, click the web icon (`</>`) to add a web app
2. Enter an app nickname (e.g., "Expense Splitter Web")
3. Check "Also set up Firebase Hosting" if you want to host on Firebase
4. Click "Register app"
5. **Copy the Firebase configuration** - you'll need these values for `.env`

The config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

## Step 3: Enable Authentication

1. In Firebase Console sidebar, click "Authentication"
2. Click "Get started"
3. Click on "Email/Password" in the Sign-in providers list
4. Enable "Email/Password" (toggle the switch)
5. Click "Save"

## Step 4: Create Firestore Database

1. In Firebase Console sidebar, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we have custom security rules)
4. Select a location close to your users (e.g., `asia-south1` for India)
5. Click "Enable"

## Step 5: Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your Firebase config:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY="your-api-key-from-step-2"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# For local development with emulators (optional)
VITE_USE_FIREBASE_EMULATORS="false"
```

3. Save the file

## Step 6: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

## Step 7: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

## Step 8: Initialize Firebase in Your Project

```bash
firebase init
```

When prompted:
1. **Which Firebase features?** Select:
   - Firestore
   - Functions
   - Hosting (optional)
   - Emulators (recommended for testing)

2. **Use an existing project?** Yes
3. **Select your project** from the list

4. **Firestore Rules:** Press Enter to use `firestore.rules`
5. **Firestore Indexes:** Press Enter to use `firestore.indexes.json`

6. **Functions setup:**
   - Language: TypeScript
   - ESLint: Yes
   - Install dependencies: Yes

7. **Hosting setup** (if selected):
   - Public directory: `dist`
   - Single-page app: Yes
   - Automatic builds with GitHub: No

8. **Emulators:** Select:
   - Authentication Emulator
   - Functions Emulator
   - Firestore Emulator

## Step 9: Update .firebaserc

Open `.firebaserc` and replace `your-project-id-here` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## Step 10: Install Cloud Functions Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 11: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

This deploys the security rules from `firestore.rules`.

## Step 12: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This deploys the `createUserProfile` function that auto-creates user profiles when new users sign up.

## Step 13: Test Your Setup (Local Development)

### Option A: Test with Firebase Emulators (Recommended)

1. Update your `.env`:
```env
VITE_USE_FIREBASE_EMULATORS="true"
```

2. Start the emulators:
```bash
firebase emulators:start
```

3. In a new terminal, start your dev server:
```bash
npm run dev
```

4. Open http://localhost:5173 (or your Vite port)
5. Open http://localhost:4000 for the Firebase Emulator UI

### Option B: Test with Production Firebase

1. Ensure `.env` has `VITE_USE_FIREBASE_EMULATORS="false"`
2. Start your dev server:
```bash
npm run dev
```

3. Test signup/login at http://localhost:5173

## Step 14: Deploy to Production

### Deploy Cloud Functions (if not done)
```bash
firebase deploy --only functions
```

### Deploy Security Rules (if not done)
```bash
firebase deploy --only firestore:rules
```

### Build and Deploy Hosting (optional)
```bash
npm run build
firebase deploy --only hosting
```

Or deploy everything at once:
```bash
npm run build
firebase deploy
```

## Testing Checklist

After deployment, test these critical flows:

### Authentication
- [ ] New user can sign up
- [ ] User profile auto-created in Firestore (check Firebase Console → Firestore → users collection)
- [ ] User can log in
- [ ] User can log out
- [ ] Session persists on page reload

### Expenses
- [ ] Add a new expense
- [ ] View expenses list
- [ ] Edit an expense
- [ ] Delete an expense
- [ ] Balance calculation is correct
- [ ] Real-time updates work (open two browser tabs, add expense in one, see it in the other)

### Security
- [ ] Cannot access without authentication
- [ ] Cannot see other users' expenses (test with two accounts)
- [ ] Cannot modify expenses paid by other user

## Monitoring

### Firebase Console
Monitor your app usage:
- **Authentication:** Check user sign-ups and logins
- **Firestore:** Monitor read/write operations and data
- **Functions:** Check execution logs and errors

### Quotas (Free Tier Limits)
Keep an eye on:
- Firestore reads: 50K/day
- Firestore writes: 20K/day
- Cloud Function invocations: 125K/month
- Authentication users: Unlimited

## Troubleshooting

### "Permission denied" errors
- Check that Firestore security rules are deployed
- Verify user is authenticated
- Check that the user ID matches in the request

### Cloud Function not executing
- Check Firebase Console → Functions → Logs
- Verify the function is deployed: `firebase functions:list`
- Ensure billing is enabled (required for Cloud Functions)

### Real-time updates not working
- Check browser console for errors
- Verify Firestore rules allow read access
- Check network tab for WebSocket connections

### Emulator connection issues
- Ensure emulators are running: `firebase emulators:start`
- Check `.env` has `VITE_USE_FIREBASE_EMULATORS="true"`
- Verify ports are not blocked (4000, 5001, 8080, 9099)

## Next Steps

After successful setup:
1. Test all functionality thoroughly
2. Monitor Firebase usage for first few days
3. Once confident, proceed with Phase 6: Cleanup
   - Remove Supabase dependencies
   - Delete Supabase integration code
   - Decommission Supabase project

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
