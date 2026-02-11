import { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  updateProfile,
  AuthError,
  PhoneAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  signInWithPhone: (verificationId: string, code: string, displayName?: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Custom hook for Firebase Authentication on React Native.
 * Phone auth uses the native Firebase SDK (no RecaptchaVerifier needed).
 * Google Sign-In uses credential-based auth.
 */
export const useFirebaseAuth = (): UseFirebaseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Complete phone auth with verification ID and OTP code.
   * The verificationId comes from the native phone auth flow.
   */
  const signInWithPhone = async (
    verificationId: string,
    code: string,
    displayName?: string
  ): Promise<void> => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(auth, credential);

      if (result.user && displayName) {
        await updateProfile(result.user, { displayName });
        await result.user.reload();
        setUser(auth.currentUser);
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Phone sign in error:', authError);

      switch (authError.code) {
        case 'auth/invalid-verification-code':
          throw new Error('Invalid OTP. Please check and try again');
        case 'auth/code-expired':
          throw new Error('OTP has expired. Please request a new one');
        case 'auth/invalid-phone-number':
          throw new Error('Invalid phone number format');
        case 'auth/too-many-requests':
          throw new Error('Too many requests. Please try again later');
        default:
          throw new Error('Failed to verify OTP. Please try again');
      }
    }
  };

  /**
   * Sign in with Google credential
   */
  const signInWithGoogle = async (idToken: string): Promise<void> => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      const authError = error as AuthError;
      console.error('Google sign in error:', authError);
      throw new Error('Failed to sign in with Google. Please try again');
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out. Please try again');
    }
  };

  return {
    user,
    loading,
    signInWithPhone,
    signInWithGoogle,
    signOut,
  };
};
