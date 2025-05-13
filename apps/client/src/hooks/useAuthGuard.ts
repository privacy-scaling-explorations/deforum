import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGlobalContext } from '@/contexts/GlobalContext';

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useGlobalContext();

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !isLoggedIn) {
      navigate({ to: '/' });
      return false;
    }
    return true;
  }, [isLoggedIn, navigate]);

  return { checkAuth };
};
