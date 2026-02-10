import { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  updateProfile,
  AuthError,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';

interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Custom hook for Firebase Authentication
 * Provides auth state management and authentication methods
 */
export const useFirebaseAuth = (): UseFirebaseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes
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
   * Send OTP to phone number
   */
  const signInWithPhone = async (
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );
      return confirmationResult;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Phone sign in error:', authError);

      // Throw user-friendly error messages
      switch (authError.code) {
        case 'auth/invalid-phone-number':
          throw new Error('Invalid phone number format');
        case 'auth/too-many-requests':
          throw new Error('Too many requests. Please try again later');
        case 'auth/captcha-check-failed':
          throw new Error('reCAPTCHA verification failed');
        case 'auth/quota-exceeded':
          throw new Error('SMS quota exceeded. Please try again later');
        default:
          throw new Error('Failed to send OTP. Please try again');
      }
    }
  };

  /**
   * Verify OTP and complete sign in
   */
  const verifyOTP = async (
    confirmationResult: ConfirmationResult,
    otp: string,
    displayName?: string
  ): Promise<void> => {
    try {
      const result = await confirmationResult.confirm(otp);

      // Update user profile with display name if provided
      if (result.user && displayName) {
        await updateProfile(result.user, {
          displayName: displayName,
        });

        // Refresh the user object to get updated profile
        await result.user.reload();
        setUser(auth.currentUser);
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('OTP verification error:', authError);

      // Throw user-friendly error messages
      switch (authError.code) {
        case 'auth/invalid-verification-code':
          throw new Error('Invalid OTP. Please check and try again');
        case 'auth/code-expired':
          throw new Error('OTP has expired. Please request a new one');
        default:
          throw new Error('Failed to verify OTP. Please try again');
      }
    }
  };

  /**
   * Sign out current user
   */
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
    verifyOTP,
    signOut,
  };
};
