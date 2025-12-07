import { useState } from 'react';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { toast } from 'react-hot-toast';

export default function InviteUser({ type }) {
  const { orgId, api } = useClerkAuth();
  const [email, setEmail] = useState('');

  const send = async () => {
    if (!orgId) return toast.error('No organization');

    const res = await api('/clerk/invite', {
      method: 'POST',
      body: JSON.stringify({
        email,
        publicMetadata: { type },
      }),
    });

    if (res.ok) {
      toast.success('Invite sent!');
      setEmail('');
    } else {
      toast.error('Failed');
    }
  };

  return (
    <div className="flex gap-2">
      <input
        placeholder={`${type} email`}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-2 py-1"
      />
      <button onClick={send} className="bg-teal-600 text-white px-3 py-1 rounded">
        Invite
      </button>
    </div>
  );
}