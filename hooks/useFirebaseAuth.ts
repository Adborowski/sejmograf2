'use client';

import { useState } from 'react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
} from '@/lib/firebase/auth';

export const useFirebaseAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
  };
};
