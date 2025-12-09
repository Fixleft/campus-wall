import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('ADMIN_TOKEN');

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  if (!token) return null;

  return <>{children}</>;
}