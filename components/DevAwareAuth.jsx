// src/components/DevAwareAuth.jsx
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useClerkAuth } from '@/hooks/useClerkAuth';

export const DevSignedIn = ({ children }) => {
  const { isDev, isSignedIn } = useClerkAuth();

  if (isDev) {
    return <>{children}</>;
  }

  return <SignedIn>{children}</SignedIn>;
};

export const DevSignedOut = ({ children }) => {
  const { isDev, isSignedIn } = useClerkAuth();

  if (isDev && isSignedIn) {
    return null; // hide sign-in page in dev when already "signed in"
  }

  return <SignedOut>{children}</SignedOut>;
};