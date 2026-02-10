import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function: Auto-create user profile when a new user signs up
 * Triggered by Firebase Authentication onCreate event
 */
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  try {
    // Create user profile document in Firestore
    await admin.firestore().collection('users').doc(uid).set({
      displayName: displayName || email?.split('@')[0] || 'User',
      email: email || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`User profile created for ${uid}`, { email });
  } catch (error) {
    functions.logger.error('Error creating user profile', { uid, error });
    throw error;
  }
});

/**
 * Cloud Function: Clean up user data when a user is deleted
 * Triggered by Firebase Authentication onDelete event
 */
export const deleteUserData = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    // Delete user profile
    await admin.firestore().collection('users').doc(uid).delete();

    // Note: In production, you might want to archive expenses instead of deleting
    // or handle them differently based on business logic
    functions.logger.info(`User data deleted for ${uid}`);
  } catch (error) {
    functions.logger.error('Error deleting user data', { uid, error });
    throw error;
  }
});
