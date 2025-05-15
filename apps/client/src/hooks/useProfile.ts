import { useGlobalContext } from '@/contexts/GlobalContext';
import { trpc } from '@/lib/trpc';

export const useProfile = () => {
  const { user, isLoading } = useGlobalContext();

  return {
    profile: user,
    isLoading: isLoading.user,
    error: null
  };
};

export const useGetProfile = (username: string) => {
  return trpc.users.byUsername.useQuery({ username });
};
