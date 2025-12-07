// src/hooks/useClerkAuth.jsx
// The ONE source of truth for auth in the entire app — used by 100+ components
import { useCallback, useMemo } from 'react';
import {
  useAuth,
  useUser,
  useOrganization,
  useClerk,
} from '@clerk/clerk-react';

export const useClerkAuth = () => {
  const isDev = import.meta.env.DEV;
  const { isLoaded: authLoaded, isSignedIn: clerkSignedIn, getToken: clerkGetToken } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { organization, orgRole } = useOrganization();
  const { signOut } = useClerk();

  // ===================================================================
  // DEV MODE — uses global __DEV_USER__ set by DevUserPanel (zero hooks needed)
  // ===================================================================
if (isDev) {
  const dev = window.__DEV_USER__;

  // NO DEV USER = NOT SIGNED IN (show landing page)
  if (!dev) {
    return {
      loading: false,
      isSignedIn: false,
      isDev: true,
      user: null,
      role: null,
      schoolId: null,
      email: null,
      getToken: async () => 'dev-jwt-12345',
      logout: () => window.location.reload(),
    };
  }

  // DEV USER EXISTS = SIGNED IN
  return {
    loading: false,
    isSignedIn: true,
    isDev: true,
    user: {
      id: dev.id,
      firstName: dev.firstName,
      primaryEmailAddress: { emailAddress: dev.email },
      publicMetadata: dev.publicMetadata,
    },
    role: dev.publicMetadata.isSuperadmin
      ? 'superadmin'
      : dev.publicMetadata.role === 'ADMIN'
      ? 'schooladmin'
      : dev.publicMetadata.role === 'LECTURER'
      ? 'lecturer'
      : dev.publicMetadata.role === 'PARENT'
      ? 'parent'
      : 'student',
    schoolId: dev.publicMetadata.schoolId || null,
    email: dev.email,
    getToken: async ({ template } = {}) => 'dev-jwt-12345',
    logout: () => window.location.reload(),
  };
}

  // ===================================================================
  // PRODUCTION MODE — real Clerk
  // ===================================================================
  if (!authLoaded || !userLoaded) {
    return { loading: true };
  }

  if (!clerkSignedIn || !clerkUser) {
    return {
      loading: false,
      isSignedIn: false,
      isDev: false,
      user: null,
      role: null,
      schoolId: null,
      email: null,
      getToken: async () => null,
      logout: () => signOut(),
    };
  }

  const meta = clerkUser.publicMetadata || {};

  const role = meta.isSuperadmin
    ? 'superadmin'
    : orgRole === 'admin' || meta.role === 'ADMIN'
    ? 'schooladmin'
    : meta.type === 'lecturer'
    ? 'lecturer'
    : meta.type === 'parent'
    ? 'parent'
    : 'student';

  const schoolId = organization?.slug ?? meta.schoolId ?? meta.schoolSlug ?? null;

  const getToken = useCallback(
    async ({ template } = {}) => {
      try {
        return await clerkGetToken({ template });
      } catch {
        return null;
      }
    },
    [clerkGetToken]
  );

  return {
    loading: false,
    isSignedIn: true,
    isDev: false,
    user: clerkUser,
    role,
    schoolId,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    orgId: organization?.id || null,
    orgSlug: organization?.slug || null,
    orgRole: orgRole || 'member',
    getToken,
    logout: () => signOut({ redirectUrl: '/' }),
  };
};