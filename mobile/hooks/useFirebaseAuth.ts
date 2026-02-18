import { useState, useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface UseFirebaseAuthReturn {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  sendPhoneOtp: (phoneNumber: string) => Promise<void>;
  verifyPhoneOtp: (code: string, displayName?: string) => Promise<FirebaseAuthTypes.User>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Module-level variable so confirmation survives component remounts caused by
// Firebase's reCAPTCHA URL scheme triggering Expo Router navigation.
let moduleConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

export const useFirebaseAuth = (): UseFirebaseAuthReturn => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(
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

  const sendPhoneOtp = async (phoneNumber: string): Promise<void> => {
    try {
      const result = await auth().signInWithPhoneNumber(phoneNumber);
      moduleConfirmation = result;
    } catch (error: any) {
      console.error('Send OTP error:', error);

      switch (error?.code) {
        case 'auth/invalid-phone-number':
          throw new Error('Invalid phone number format');
        case 'auth/too-many-requests':
          throw new Error('Too many requests. Please try again later');
        default:
          throw new Error('Failed to send OTP. Please try again');
      }
    }
  };

  const verifyPhoneOtp = async (
    code: string,
    displayName?: string
  ): Promise<FirebaseAuthTypes.User> => {
    if (!moduleConfirmation) {
      throw new Error('Please request OTP before verifying');
    }

    try {
      const credential = await moduleConfirmation.confirm(code);

      if (credential.user && displayName) {
        await credential.user.updateProfile({ displayName });
        await credential.user.reload();
      }

      if (!credential.user) {
        throw new Error('Unable to sign in with OTP');
      }

      moduleConfirmation = null;
      return credential.user;
    } catch (error: any) {
      console.error('Phone sign in error:', error);

      switch (error?.code) {
        case 'auth/invalid-verification-code':
          throw new Error('Invalid OTP. Please check and try again');
        case 'auth/code-expired':
          throw new Error('OTP has expired. Please request a new one');
        case 'auth/session-expired':
          throw new Error('OTP session expired. Please request a new OTP');
        default:
          throw new Error('Failed to verify OTP. Please try again');
      }
    }
  };

  const signInWithGoogle = async (_idToken: string): Promise<void> => {
    throw new Error(
      'Google Sign-In requires native Google auth setup and is not enabled in this build yet'
    );
  };

  const signOut = async (): Promise<void> => {
    try {
      moduleConfirmation = null;
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out. Please try again');
    }
  };

  return {
    user,
    loading,
    sendPhoneOtp,
    verifyPhoneOtp,
    signInWithGoogle,
    signOut,
  };
};
