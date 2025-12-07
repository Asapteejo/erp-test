import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';  // Your existing
import API from '../api';

const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
  const [school, setSchool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();  // For admin/schoolId

  useEffect(() => {
    const loadSchool = async () => {
      try {
        const subdomain = window.location.host.split('.')[0];  // e.g., "hsx"
        if (subdomain === 'localhost' || subdomain === 'www') {
          // Fallback: Use selector or user's school
          const storedId = localStorage.getItem('selectedSchoolId');
          if (storedId || user?.schoolId) {
            const id = storedId || user.schoolId;
            const res = await API.get(`/public/schools/${id}`);  // Adjust endpoint
            setSchool(res.data);
          }
        } else {
          const res = await API.get(`/public/schools/${subdomain}`);  // Your existing route
          setSchool(res.data);
          localStorage.setItem('selectedSchoolId', res.data.id);
        }
        
        // Apply theme
        if (res.data) {
          document.documentElement.style.setProperty('--primary-color', res.data.primaryColor);
          document.documentElement.style.setProperty('--secondary-color', res.data.secondaryColor);
          // Add more: --motto, etc.
        }
      } catch (err) {
        console.error('School load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchool();
  }, [user]);

  return (
    <SchoolContext.Provider value={{ school, isLoading }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => useContext(SchoolContext);
