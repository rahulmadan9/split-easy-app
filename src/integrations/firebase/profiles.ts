import { doc, setDoc, getDoc, collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { User } from 'firebase/auth';

/**
 * Creates or updates a user profile in Firestore.
 * On first login, also creates a personal group for the user.
 */
export const createUserProfile = async (user: User): Promise<void> => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const displayName = user.displayName || user.phoneNumber || 'User';

    // Create personal group first
    const personalGroupRef = await addDoc(collection(db, 'groups'), {
      name: 'Personal',
      inviteCode: '',
      createdBy: user.uid,
      createdByName: displayName,
      isPersonal: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Add user as admin member of personal group
    await setDoc(doc(db, 'groups', personalGroupRef.id, 'members', user.uid), {
      userId: user.uid,
      userName: displayName,
      role: 'admin',
      joinedAt: serverTimestamp(),
    });

    // Create user profile with personal group reference
    await setDoc(userRef, {
      displayName,
      phoneNumber: user.phoneNumber || '',
      personalGroupId: personalGroupRef.id,
      currentGroupId: personalGroupRef.id,
      groupIds: [personalGroupRef.id],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } else {
    await setDoc(
      userRef,
      { updatedAt: Timestamp.now() },
      { merge: true }
    );
  }
};
