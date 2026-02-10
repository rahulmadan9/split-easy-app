# Supabase to Firebase Migration Plan

## Overview
Migrate expense-splitting app from Supabase to Firebase with a balanced approach over 2-3 weeks. No historical data migration (starting fresh).

## User Preferences
- **Timeline**: Balanced approach (2-3 weeks)
- **User Migration**: Password reset required
- **Budget**: Stay within Firebase free tier
- **Data Migration**: Start fresh (no historical data)

---

## Firebase Architecture Design

### Collections Structure

```
users/{userId}
  - displayName: string
  - email: string
  - createdAt: Timestamp
  - updatedAt: Timestamp

expenses/{expenseId}
  - description: string
  - amount: number
  - paidBy: string (user ID)
  - paidByName: string (denormalized)
  - splitType: 'fifty_fifty' | 'custom' | 'one_owes_all'
  - customSplitAmount: number | null
  - owesUserId: string | null
  - owesUserName: string | null (denormalized)
  - category: 'rent' | 'utilities' | 'groceries' | 'household_supplies' | 'shared_meals' | 'purchases' | 'other'
  - expenseDate: string (ISO date)
  - notes: string | null
  - isPayment: boolean
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - groupId: string | null
```

**Key Design Decisions:**
- Denormalize user names in expenses to reduce reads
- Use root-level collections (not nested) for efficient querying
- Firestore Timestamps for server-side time management

### Feature Mapping

| Supabase Feature | Firebase Equivalent | Notes |
|------------------|---------------------|-------|
| Auth (email/password) | Firebase Authentication | 1:1 mapping |
| PostgreSQL tables | Firestore collections | Document-oriented design |
| Real-time subscriptions | Firestore `onSnapshot()` | More granular change detection |
| RLS policies | Security Rules | Declarative rules file |
| `handle_new_user()` trigger | Cloud Function `onCreate` | Auto-create user profile |
| `update_updated_at_column()` | `serverTimestamp()` | Manual in code |
| Type generation | Manual types | No auto-generation |

---

## Migration Phases (2-3 Weeks)

### Phase 1: Firebase Setup (Days 1-3)
**Goal:** Establish Firebase infrastructure and tooling

**Tasks:**
1. Create Firebase project in console
2. Install dependencies: `firebase`, `firebase-admin`
3. Set up environment variables in `.env`
4. Create Firebase config file: `src/integrations/firebase/config.ts`
5. Create type definitions: `src/integrations/firebase/types.ts`
6. Initialize Cloud Functions project in `/functions`
7. Deploy Cloud Function for auto-creating user profiles
8. Create initial Firestore security rules (permissive for dev)
9. Set up Firebase emulators for local testing

**Deliverables:**
- Firebase project configured
- Cloud Function deployed
- Local emulator running
- Environment variables set

**Critical Files:**
- `src/integrations/firebase/config.ts`
- `src/integrations/firebase/types.ts`
- `functions/src/index.ts`
- `firestore.rules`

---

### Phase 2: Authentication Migration (Days 4-6)
**Goal:** Replace Supabase Auth with Firebase Authentication

**Tasks:**
1. Create `src/hooks/useFirebaseAuth.tsx` hook
2. Update `src/pages/Auth.tsx` to use Firebase auth
   - Replace `signInWithPassword()` → `signInWithEmailAndPassword()`
   - Replace `signUp()` → `createUserWithEmailAndPassword()`
   - Add `updateProfile()` for display names
3. Test signup flow (verify Cloud Function creates user profile)
4. Test login flow (session persistence)
5. Test logout and auth state changes
6. Update protected routes if needed

**Implementation:**
```typescript
// src/hooks/useFirebaseAuth.tsx
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = () => firebaseSignOut(auth);

  return { user, loading, signOut };
};
```

**Testing Checklist:**
- [ ] New users can sign up
- [ ] User profile auto-created in Firestore
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Session persists on page reload
- [ ] Logout clears session
- [ ] Display name saved correctly

**Files Modified:**
- `src/pages/Auth.tsx` (auth UI)
- `src/hooks/useAuth.tsx` → replace with `useFirebaseAuth.tsx`

---

### Phase 3: Data Layer Migration (Days 7-11)
**Goal:** Replace Supabase database operations with Firestore

#### 3.1 Profiles Hook
**Create:** `src/hooks/useFirebaseProfiles.tsx`

**Key Changes:**
- Replace `supabase.from('profiles').select('*')` with Firestore query
- Use `onSnapshot()` for real-time updates
- Map Firestore docs to expected profile structure

**Implementation:**
```typescript
export const useFirebaseProfiles = () => {
  const { user } = useFirebaseAuth();
  const [profiles, setProfiles] = useState<FirebaseProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<FirebaseProfile | null>(null);
  const [roommate, setRoommate] = useState<FirebaseProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profilesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseProfile[];

      setProfiles(profilesData);
      setCurrentProfile(profilesData.find(p => p.id === user.uid) || null);
      setRoommate(profilesData.find(p => p.id !== user.uid) || null);
    });

    return () => unsubscribe();
  }, [user]);

  return { profiles, currentProfile, roommate, loading };
};
```

#### 3.2 Expenses Hook
**Create:** `src/hooks/useFirebaseExpenses.tsx`

**Key Changes:**
- Query expenses with `where('paidBy', 'in', [currentUserId, roommateId])`
- Real-time listener with `onSnapshot()`
- `addExpense`: Use `addDoc()` with denormalized names
- `deleteExpense`: Use `deleteDoc()`
- Keep `calculateBalance` logic identical (no changes)

**Optimization for Free Tier:**
- Use compound queries to minimize reads
- Add client-side caching where possible
- Limit real-time listeners to active views only

**Implementation:**
```typescript
const addExpense = async (expenseData) => {
  const paidByName = profiles.find(p => p.id === expenseData.paidBy)?.displayName || '';
  const owesUserName = expenseData.owesUserId
    ? profiles.find(p => p.id === expenseData.owesUserId)?.displayName || null
    : null;

  await addDoc(collection(db, 'expenses'), {
    ...expenseData,
    paidByName,
    owesUserName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};
```

**Files Created:**
- `src/hooks/useFirebaseProfiles.tsx`
- `src/hooks/useFirebaseExpenses.tsx`

**Files Modified:**
- `src/hooks/useProfiles.tsx` → replace implementation
- `src/hooks/useExpenses.tsx` → replace implementation

---

### Phase 4: Component Updates (Days 12-14)
**Goal:** Update all UI components to use Firebase hooks

**Tasks:**
1. Update `src/components/ExpensesView.tsx`
   - Replace delete logic with Firebase `deleteDoc()`
   - Import Firebase hooks
2. Update `src/components/AddExpenseDialog.tsx`
   - Use `useFirebaseExpenses` hook
   - Update error handling
3. Update `src/components/EditExpenseDialog.tsx`
   - Replace update logic with `updateDoc()`
   - Remember to set `updatedAt: serverTimestamp()`
4. Update `src/components/AddExpenseForm.tsx` (if needed)
5. Update `src/components/ExpenseFilters.tsx` (if needed)
6. Test all user flows end-to-end

**Example Update (EditExpenseDialog.tsx):**
```typescript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

// Replace Supabase update
await updateDoc(doc(db, 'expenses', expense.id), {
  amount: parseFloat(amount),
  description,
  category,
  splitType,
  customSplitAmount: splitType === 'custom' ? parseFloat(customAmount) : null,
  expenseDate: date,
  notes: notes || null,
  updatedAt: serverTimestamp()
});
```

**Files Modified:**
- `src/components/ExpensesView.tsx`
- `src/components/AddExpenseDialog.tsx`
- `src/components/EditExpenseDialog.tsx`
- `src/components/AddExpenseForm.tsx`
- `src/components/ExpenseFilters.tsx`

**Testing Checklist:**
- [ ] View expenses list
- [ ] Add new expense (test all split types)
- [ ] Edit existing expense
- [ ] Delete expense
- [ ] Filter expenses by date/category
- [ ] Balance calculation shows correctly
- [ ] Real-time updates work (open two browser tabs)

---

### Phase 5: Security & Production (Days 15-17)
**Goal:** Lock down security and deploy to production

#### 5.1 Finalize Security Rules
**File:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function validateExpense(expense) {
      return expense.amount > 0 &&
             expense.amount <= 1000000 &&
             expense.description.size() > 0 &&
             expense.description.size() <= 200 &&
             (expense.notes == null || expense.notes.size() <= 1000) &&
             expense.splitType in ['fifty_fifty', 'custom', 'one_owes_all'] &&
             expense.category in ['rent', 'utilities', 'groceries',
                                  'household_supplies', 'shared_meals',
                                  'purchases', 'other'];
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // Expenses collection
    match /expenses/{expenseId} {
      allow read: if isAuthenticated() && (
        resource.data.paidBy == request.auth.uid ||
        resource.data.owesUserId == request.auth.uid
      );

      allow create: if isAuthenticated() &&
        validateExpense(request.resource.data) &&
        (request.resource.data.paidBy == request.auth.uid ||
         request.resource.data.owesUserId == request.auth.uid);

      allow update: if isAuthenticated() &&
        resource.data.paidBy == request.auth.uid &&
        validateExpense(request.resource.data);

      allow delete: if isAuthenticated() &&
        resource.data.paidBy == request.auth.uid;
    }
  }
}
```

#### 5.2 Security Testing
Use Firebase Rules Unit Testing:

```typescript
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

test('Users can read their own expenses', async () => {
  const alice = testEnv.authenticatedContext('alice');
  await assertSucceeds(alice.firestore().collection('expenses').doc('expense1').get());
});

test('Users cannot read others expenses', async () => {
  const bob = testEnv.authenticatedContext('bob');
  await assertFails(bob.firestore().collection('expenses').doc('alice-expense').get());
});
```

**Testing Checklist:**
- [ ] Unauthenticated users blocked from all operations
- [ ] Users can only read expenses they're involved in
- [ ] Users can only update/delete their own expenses
- [ ] Invalid data rejected (amount > 1M, etc.)
- [ ] Enum validation works (categories, split types)

#### 5.3 Production Deployment

**Pre-deployment:**
1. Test with Firebase emulators
2. Run security rules tests
3. Test on staging environment (if available)
4. Review Firebase quota limits

**Deployment Steps:**
1. Deploy security rules: `firebase deploy --only firestore:rules`
2. Deploy Cloud Functions: `firebase deploy --only functions`
3. Update environment variables in production
4. Deploy application code
5. Monitor Firebase console for errors

**Post-deployment:**
1. Monitor authentication success rate
2. Check Firestore read/write metrics
3. Verify Cloud Function executions
4. Test all critical user flows in production

---

### Phase 6: Cleanup (Days 18-21)
**Goal:** Remove Supabase dependencies and finalize migration

**Tasks:**
1. Remove Supabase packages from `package.json`
2. Delete `src/integrations/supabase/` directory
3. Remove Supabase environment variables
4. Update documentation (if any)
5. Notify users about password reset requirement
6. Decommission Supabase project (after 7-day safety period)

**Files to Delete:**
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `supabase/migrations/*` (archive if needed)

**Package.json Changes:**
- Remove: `@supabase/supabase-js`
- Keep: `firebase`, `firebase-admin`

---

## Critical Files Summary

### New Files to Create
1. **`src/integrations/firebase/config.ts`** - Firebase initialization
2. **`src/integrations/firebase/types.ts`** - TypeScript type definitions
3. **`src/hooks/useFirebaseAuth.tsx`** - Auth state management
4. **`src/hooks/useFirebaseProfiles.tsx`** - User profiles with real-time
5. **`src/hooks/useFirebaseExpenses.tsx`** - Expense CRUD with real-time
6. **`functions/src/index.ts`** - Cloud Function for user creation
7. **`firestore.rules`** - Security rules file
8. **`firebase.json`** - Firebase configuration
9. **`.firebaserc`** - Firebase project mapping

### Files to Modify
1. **`package.json`** - Add Firebase deps, remove Supabase
2. **`.env`** - Add Firebase config vars
3. **`src/pages/Auth.tsx`** - Update auth logic
4. **`src/hooks/useAuth.tsx`** - Replace with Firebase version
5. **`src/hooks/useProfiles.tsx`** - Replace implementation
6. **`src/hooks/useExpenses.tsx`** - Replace implementation
7. **`src/components/ExpensesView.tsx`** - Update delete logic
8. **`src/components/AddExpenseDialog.tsx`** - Update add logic
9. **`src/components/EditExpenseDialog.tsx`** - Update edit logic

---

## Trade-offs & Considerations

### Lost Features
- **Auto-generated types**: Must manually maintain TypeScript types
- **Automatic timestamp updates**: Must call `serverTimestamp()` on updates
- **SQL querying**: No JOINs, limited query operators
- **Database constraints**: Security rules + client validation instead

### Gained Features
- **Offline support**: Built-in offline persistence
- **Simpler real-time**: More intuitive `onSnapshot()` API
- **Better scaling**: Auto-scaling without configuration
- **Integrated ecosystem**: Easy to add Storage, Analytics, etc.

### Cost Optimization (Free Tier)
Firebase free tier limits:
- 50K reads/day
- 20K writes/day
- 1GB storage
- 10GB/month bandwidth

**Optimization strategies:**
1. **Limit real-time listeners**: Only subscribe when component mounted
2. **Use query limits**: Don't fetch all expenses at once
3. **Client-side caching**: Cache profiles to reduce reads
4. **Denormalization**: Store names in expenses (fewer joins)
5. **Pagination**: Implement if expense count grows large

**Expected usage (2 users, ~100 expenses/month):**
- Reads: ~5K/month (well within limits)
- Writes: ~400/month (well within limits)
- **Result**: Should stay within free tier

---

## Testing Strategy

### Unit Tests
- Mock Firestore/Auth in hook tests
- Test balance calculation logic
- Validate Zod schemas (no changes)

### Integration Tests (Firebase Emulators)
```bash
firebase emulators:start --only firestore,auth,functions
```

Test scenarios:
1. User signup → Profile auto-creation
2. Add expense → Real-time update
3. Edit expense → Permission enforcement
4. Delete expense → Security check
5. Balance accuracy

### Security Rules Testing
```typescript
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

// Test read permissions
// Test write permissions
// Test validation rules
```

### End-to-End Testing
- Sign up new user
- Add expenses (all split types)
- Edit expense
- Delete expense
- Check balance calculation
- Test real-time sync (two browser tabs)

---

## Rollback Plan

**If migration fails:**
1. Keep Supabase credentials for 7 days after cutover
2. Can revert code changes via git
3. No data loss (started fresh, no migration)
4. Re-enable Supabase if critical issues found

**Rollback triggers:**
- Auth success rate < 85%
- Critical bugs in production
- Firebase costs exceed budget
- Real-time updates failing

---

## Success Criteria

- [ ] All users can sign up and log in with Firebase
- [ ] User profiles auto-created on signup
- [ ] Expenses can be created, edited, deleted
- [ ] Real-time updates work across browser tabs
- [ ] Balance calculations match expected results
- [ ] Security rules block unauthorized access
- [ ] Application stays within Firebase free tier
- [ ] No Supabase dependencies remain
- [ ] All tests passing

---

## Timeline Summary

| Phase | Days | Risk |
|-------|------|------|
| 1. Firebase Setup | 1-3 | Low |
| 2. Auth Migration | 4-6 | Medium |
| 3. Data Layer | 7-11 | Medium |
| 4. Components | 12-14 | Low |
| 5. Security & Prod | 15-17 | High |
| 6. Cleanup | 18-21 | Low |

**Total: 2-3 weeks** (with testing buffer)

---

## Next Steps After Plan Approval

1. Create Firebase project in console
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Initialize Firebase in project: `firebase init`
4. Begin Phase 1 implementation
