# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Is
Split Easy is an expense-splitting app with group debt settlement. It has a web PWA and a React Native mobile app sharing core logic via a `shared/` package, backed by Firebase (Firestore + Phone OTP Auth + Cloud Functions).

## Commands

### Web (run from root)
- `npm run dev` — Vite dev server on port 8080
- `npm run build` — production build → `dist/`
- `npm run lint` — ESLint
- `npm test` — Vitest (single run)
- `npm run test:watch` — Vitest watch mode

### Mobile (run from `mobile/`)
- `expo start` — start Metro bundler
- `expo run:ios` / `expo run:android` — build and run natively
- `eas build --profile development` — dev client build
- `eas build --profile preview` — internal distribution build

### Cloud Functions (run from `functions/`)
- `npm run build` — compile TypeScript
- `npm run serve` — build + start local emulators
- `npm run deploy` — deploy to Firebase

### Firebase CLI (run from root)
- `firebase emulators:start` — start all emulators (Auth:9099, Firestore:8080, Functions:5001, UI:4000)
- `firebase deploy --only hosting` / `firestore:rules` / `functions`

## Monorepo Structure

```
split-easy/
├── src/              # Web PWA — React 18 + Vite + Tailwind + shadcn/ui
├── shared/           # Platform-agnostic TypeScript (no React, no RN)
│   ├── lib/          # debtSimplification, amountCalculator, errorHandler, validation
│   ├── types/        # firebase.ts — all Firestore document interfaces
│   └── constants/    # categories.ts
├── mobile/           # Expo SDK 54 React Native app
│   ├── app/          # expo-router file-based routes
│   ├── hooks/        # RN-specific hooks
│   ├── lib/          # firebase.ts, profiles.ts, colors.ts, csvExport.ts
│   └── components/   # RN-specific UI components
├── functions/        # Firebase Cloud Functions — Node 18 TypeScript (all in src/index.ts)
├── firestore.rules
└── firebase.json
```

## Shared Code Pattern (Critical)

`shared/` contains pure TypeScript with no platform dependencies. Web and mobile consume it differently:

- **Web**: `src/lib/*.ts` files are thin re-exports from `../../shared/lib/`. This preserves the `@/lib/*` import alias. Never add logic directly to the `src/lib/` wrappers.
- **Mobile**: imports directly via relative path `../../shared/lib/` or `../../shared/types/`.
- **Metro**: `mobile/metro.config.js` adds `../shared` as a watch folder for hot reload.
- **TypeScript**: `tsconfig.app.json` includes both `"src"` and `"shared"` so the web build compiles both.

When adding new shared logic, put it in `shared/lib/` and add a re-export wrapper in `src/lib/`.

## Firebase / Auth Architecture

### Web (`src/integrations/firebase/config.ts`)
- Uses Firebase JS SDK v12
- Auth persistence: `browserLocalPersistence`
- Emulator auto-connects when `VITE_USE_FIREBASE_EMULATORS=true`

### Mobile (`mobile/lib/firebase.ts`)
- Uses `@react-native-firebase/auth` (native SDK) for authentication — **not** the JS SDK
- Uses Firebase JS SDK for Firestore and Functions
- This split is required: native auth handles reCAPTCHA URL schemes correctly
- `ConfirmationResult` from OTP is stored as a **module-level variable** in `mobile/hooks/useFirebaseAuth.ts` to survive component remounts during reCAPTCHA URL redirect

### Environment Variables
- Web: `VITE_FIREBASE_*` via `import.meta.env` in `src/integrations/firebase/config.ts`
- Mobile: `EXPO_PUBLIC_FIREBASE_*` via `process.env` in `mobile/lib/firebase.ts`

## Key Architectural Patterns

### Groups State
Both web and mobile use a `GroupsProvider` React context at the root layout. It reads `users/{uid}.groupIds` (an array on the user profile), then batch-fetches each group doc. A fallback queries `collectionGroup('members')` if `groupIds` is empty (migration path). Do not query groups without going through this context.

### Firestore Data Model
- `users/{uid}` — profile with `groupIds: string[]`, `personalGroupId`
- `groups/{gid}` — with `inviteCode`, `isPersonal`
- `groups/{gid}/members/{uid}` — subcollection
- `expenses/{eid}` — filtered by `groupId`; supports `isPayment`, `isSettlement`
- `recurringExpenses/{id}` + `recurringConfirmations/{id}`
- `users/{uid}/pushTokens/{token}` — Expo push tokens

Denormalized fields (`paidByName`, `userName`, `createdByName`) are propagated by the `onUserDisplayNameUpdated` Cloud Function using batched writes.

### Debt Simplification
Algorithm lives in `shared/lib/debtSimplification.ts`. It computes net balances then greedily minimizes transactions. Used by `useGroupBalance` hook on both platforms.

### Personal Group
Every user gets an `isPersonal: true` group auto-created by the `createUserProfile` Cloud Function on first sign-up. Personal groups cannot be deleted or left.

### Push Notifications
Tokens are stored at `users/{uid}/pushTokens/{token}`. Cloud Functions send via the **Expo Push API** (`https://exp.host/--/api/v2/push/send`), not FCM directly.

### `errorHandler` `__DEV__` Guard
`shared/lib/errorHandler.ts` uses `typeof __DEV__ !== 'undefined' ? __DEV__ : false` — works in both Vite (where `__DEV__` is undefined) and React Native (where it's a global).

### TypeScript
Strict mode is **off** (`"strict": false`, `"noImplicitAny": false` in `tsconfig.app.json`).

## Mobile Route Structure (expo-router)

```
mobile/app/
├── _layout.tsx           # Root: AuthGuard + GroupsProvider
├── auth/sign-in.tsx       # Phone OTP auth
├── (tabs)/               # Main tab navigator (Home, Balance, Add, Recurring, Expenses)
├── (modals)/             # profile, create-group, join-group, group-management
└── join/[inviteCode].tsx  # Deep link handler
```

URL scheme: `spliteasy://`. Deep link for joining groups: `spliteasy://join/{inviteCode}`.

## Web Route Structure (React Router v6)

All routes render through a single `Index.tsx` shell. Route state (current view) is managed internally rather than via dedicated route components for most sub-views.

```
/auth           → Auth.tsx (OTP flow)
/join/:code     → JoinGroupLink.tsx
/               → Index.tsx (main shell — home, group detail, profile as sub-views)
```

## Cloud Functions (`functions/src/index.ts`)
All functions in one file. Key constraint: **cannot have two Firestore triggers on the same document path** — `onExpenseCreated` handles both expense and settlement notifications in a single function.

## Styling

### Web
- shadcn/ui (Radix primitives + CVA). Components in `src/components/ui/`.
- All colors via CSS variables: `hsl(var(--primary))` etc.
- `cn()` from `src/lib/utils.ts` = `clsx` + `tailwind-merge`

### Mobile
- NativeWind v4 (Tailwind for RN). Tailwind pinned to 3.3.2 for compatibility.
- CSS variables unavailable in RN — use `mobile/lib/colors.ts` for JS color constants in imperative styles.
