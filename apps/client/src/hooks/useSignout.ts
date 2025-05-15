import { useGlobalContext } from '@/contexts/GlobalContext';
import { trpc } from '../lib/trpc';

export const useSignout = () => {
  const { setIsLoggedIn } = useGlobalContext();
  const utils = trpc.useUtils();

  console.debug('[useSignout] Handling sign out');
  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    utils.auth.me.invalidate();
  };

  return { signOut };
};
