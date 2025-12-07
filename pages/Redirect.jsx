// pages/Redirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../hooks/useClerkAuth';

export default function Redirect() {
  const { isSignedIn, role, user } = useClerkAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) return;

    const schoolId = user?.publicMetadata?.schoolId;
    switch (role) {
      case 'SUPERADMIN': navigate('/saas'); break;
      case 'SCHOOL_ADMIN': navigate(`/${schoolId}/admin`); break;
      case 'LECTURER': navigate(`/${schoolId}/lecturer-portal`); break;
      case 'STUDENT': navigate(`/${schoolId}/student-portal`); break;
      default: navigate('/schools');
    }
  }, [isSignedIn, role, user]);

  return <p className="text-center text-gray-600 mt-10">Redirecting...</p>;
}
