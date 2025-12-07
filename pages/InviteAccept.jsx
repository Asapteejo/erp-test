// src/pages/InviteAccept.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const supabase = window.supabase; // Ensure Supabase client is in index.html

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { client } = useClerk();

  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      toast.error('Invalid invite link.');
      return;
    }

    const acceptInvite = async () => {
      try {
        setStatus('validating');

        // 1. Validate token
        const { data: invite, error } = await supabase
          .from('invites')
          .select('*, schools(name, subdomain)')
          .eq('token', token)
          .single();

        if (error || !invite || new Date(invite.expiresAt) < new Date()) {
          throw new Error('Invalid or expired invite.');
        }

        setStatus('creating');

        // 2. Create Clerk user
        const clerkUser = await client.users.createUser({
          emailAddress: invite.email,
          firstName: invite.type === 'student' ? invite.regNumber : undefined,
        });

        // 3. Save to Prisma
        const res = await fetch('/api/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerkId: clerkUser.id,
            email: invite.email,
            role: invite.type.toUpperCase(),
            schoolId: invite.schoolId,
            regNumber: invite.type === 'student' ? invite.regNumber : null,
            name: invite.type === 'student' ? invite.regNumber : invite.email.split('@')[0],
          }),
        });

        if (!res.ok) throw new Error('Failed to save user.');

        setStatus('success');
        toast.success('Welcome! Redirecting...');

        setTimeout(() => {
          const subdomain = invite.schools?.subdomain || invite.schoolId;
          navigate(`/${subdomain}/dashboard`);
        }, 2000);
      } catch (error) {
        console.error('Accept error:', error);
        setStatus('error');
        toast.error(error.message || 'Failed to accept invite.');
      }
    };

    acceptInvite();
  }, [token, client, navigate]);

  // UI (same as before)
  const content = {
    loading: () => (
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-teal-700 font-medium">Validating invite...</p>
      </div>
    ),
    validating: () => content.loading(),
    creating: () => (
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-teal-700 font-medium">Creating your account...</p>
      </div>
    ),
    success: () => (
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-3xl">Checkmark</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h1>
        <p className="text-gray-600 mb-6">Your account is ready.</p>
        <div className="bg-teal-600 text-white px-6 py-3 rounded-lg inline-block">
          Redirecting...
        </div>
      </div>
    ),
    error: () => (
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-3xl">Warning</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Invite Error</h1>
        <p className="text-gray-600 mb-6">This link is invalid or expired.</p>
        <button
          onClick={() => navigate('/sign-in')}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
        >
          Go to Sign In
        </button>
      </div>
    ),
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {content[status]()}
      </motion.div>
    </div>
  );
}