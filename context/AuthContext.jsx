import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

console.log('AuthContext.jsx loaded');
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      console.log('Submitting login with:', { email });
      const response = await API.post('/api/auth/login', { email, password });
      console.log('Full response:', response); // ADD THIS LINE
      console.log('response.data:', response.data); // ADD THIS LINE
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      console.log('Login successful, user set:', user);
    } catch (error) {
      console.error('Login error:', error.response?.data?.error || error.message);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login', { replace: true });
    console.log('Logout complete, token:', localStorage.getItem('token'), 'user:', user);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isLoading && !user) {
      setIsLoading(true);
      console.log('Checking token on load...');
      API.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {
          setUser(response.data);
          console.log('User restored:', response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          setUser(null);
          setIsLoading(false);
          navigate('/login', { replace: true });
        });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
