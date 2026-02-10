# Two Track Teller

An expense-splitting application for roommates and shared living situations, built with React, TypeScript, and Firebase.

## Overview

Two Track Teller helps you effortlessly track and split expenses with your roommate. Sign in with your phone number via OTP, add expenses, and automatically calculate who owes whom. Perfect for managing rent, groceries, utilities, and shared purchases.

## Features

- **Phone OTP Authentication** - Secure login using mobile number with SMS verification
- **Persistent Sessions** - Stay logged in across browser sessions until you log out
- **Real-time Expense Tracking** - Add, edit, and delete expenses instantly
- **Smart Split Calculations** - Automatic balance calculations with flexible split options:
  - 50/50 split
  - Custom amounts
  - One person owes all
- **Expense Categories** - Organize expenses by type (rent, utilities, groceries, etc.)
- **Payment Records** - Track settlements between roommates
- **Real-time Sync** - Changes sync instantly across all devices
- **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible UI components
- **React Router** - Client-side routing

### Backend & Services
- **Firebase Authentication** - Phone OTP authentication
- **Cloud Firestore** - Real-time NoSQL database
- **Firebase Hosting** - Static site hosting (optional)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Google account for Firebase Console
- Firebase project with Phone Authentication enabled

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd two-track-teller
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**

   Follow the detailed guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to:
   - Create a Firebase project
   - Enable Phone Authentication
   - Configure Firestore Database
   - Get your Firebase configuration credentials

4. **Configure environment variables**

   Update `.env` with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_USE_FIREBASE_EMULATORS="false"
   ```

5. **Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Firebase Setup

This project uses Firebase for authentication and data storage. To set up Firebase:

1. **Quick Setup** (Automated via CLI)
   - Firebase project has been created: `two-track-teller-1770026581`
   - Configuration is already set in `.env`
   - Firestore security rules are deployed
   - Phone Authentication is enabled

2. **Manual Steps Required**
   - Enable Phone Authentication in [Firebase Console](https://console.firebase.google.com/project/two-track-teller-1770026581/authentication/providers)
   - Note: Free tier has 10 SMS/day limit

For detailed setup instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## Authentication

The app uses **Phone OTP Authentication** with **Persistent Sessions**:

1. Enter your 10-digit mobile number (India +91)
2. Receive a 6-digit OTP via SMS
3. Verify OTP to sign in
4. User profile automatically created in Firestore
5. **Stay logged in** - session persists across browser restarts until explicit logout

### Session Persistence
- Users remain logged in even after closing the browser
- Authentication token stored securely in localStorage
- Automatic session restoration on app reload
- No need to re-login unless you explicitly log out

See [PHONE_AUTH_MIGRATION.md](./PHONE_AUTH_MIGRATION.md) for authentication details and [SESSION_PERSISTENCE.md](./SESSION_PERSISTENCE.md) for session management details.

## Project Structure

```
two-track-teller/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components (Auth, Home, etc.)
│   ├── hooks/            # Custom React hooks
│   │   ├── useFirebaseAuth.tsx      # Authentication logic
│   │   ├── useFirebaseExpenses.tsx  # Expense management
│   │   └── useFirebaseProfiles.tsx  # User profiles
│   ├── integrations/
│   │   └── firebase/
│   │       ├── config.ts            # Firebase initialization
│   │       ├── types.ts             # TypeScript interfaces
│   │       └── profiles.ts          # Profile creation helper
│   ├── lib/              # Utility functions
│   └── App.tsx           # Main app component
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── firebase.json         # Firebase configuration
├── .firebaserc          # Firebase project mapping
└── .env                 # Environment variables
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint

# Deploy to Firebase (requires Blaze plan for Functions)
firebase deploy
```

## Firestore Data Structure

### Users Collection (`users`)
```typescript
{
  id: string;              // Firebase Auth UID
  displayName: string;     // User's display name
  email: string;           // Email (optional)
  phoneNumber: string;     // Phone number
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Expenses Collection (`expenses`)
```typescript
{
  id: string;
  description: string;
  amount: number;
  paidBy: string;          // User ID
  paidByName: string;      // Denormalized
  splitType: 'fifty_fifty' | 'custom' | 'one_owes_all';
  customSplitAmount?: number;
  owesUserId?: string;
  owesUserName?: string;
  category: string;
  expenseDate: string;     // ISO date
  notes?: string;
  isPayment: boolean;      // Payment vs expense
  groupId?: string;        // Future: multi-user groups
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Security

- **Firestore Security Rules** - Row-level security ensures users can only access their own data
- **Phone Authentication** - SMS OTP verification via Firebase
- **reCAPTCHA** - Bot protection for authentication
- **Client-side Validation** - Input validation before submission

## Firebase Free Tier Limits

- **Authentication**: Unlimited users
- **Firestore Reads**: 50K/day
- **Firestore Writes**: 20K/day
- **Phone Auth SMS**: 10 SMS/day (without billing)
- **Hosting**: 10GB transfer/month

## Deployment

### Firebase Hosting

1. **Build the app**
```bash
npm run build
```

2. **Deploy to Firebase**
```bash
firebase deploy --only hosting
```

3. **Deploy Firestore rules**
```bash
firebase deploy --only firestore:rules
```

### Custom Domain
Configure custom domains in Firebase Console → Hosting → Add custom domain

## Documentation

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Complete Firebase setup guide
- [PHONE_AUTH_MIGRATION.md](./PHONE_AUTH_MIGRATION.md) - Phone OTP implementation details
- [SESSION_PERSISTENCE.md](./SESSION_PERSISTENCE.md) - Session persistence implementation and testing
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Supabase to Firebase migration summary
- [NEXT_STEPS.md](./NEXT_STEPS.md) - Future enhancements and roadmap

## Troubleshooting

### Phone Authentication Issues
- Ensure Firebase Phone Auth is enabled in Console
- Check SMS quota limits (10/day on free tier)
- Verify phone number format (10 digits, no +91 prefix)
- Check browser console for reCAPTCHA errors

### Development Server Issues
- Clear `.vite` cache: `rm -rf node_modules/.vite`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check port 8080 is not in use

### Firestore Permission Errors
- Verify security rules are deployed: `firebase deploy --only firestore:rules`
- Check user is authenticated
- Ensure user ID matches document owner

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues or questions:
- Check existing documentation in the `/docs` folder
- Review Firebase Console logs
- Check browser console for errors

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Firebase](https://firebase.google.com/)
