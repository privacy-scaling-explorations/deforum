import { useGlobalContext } from '@/contexts/GlobalContext';
import { trpc } from '@/lib/trpc';

export const useBadges = () => {
  const { user, isLoading } = useGlobalContext();
  const utils = trpc.useUtils();

  const createBadge = trpc.badges.create.useMutation({
    onSuccess: (data) => {
      utils.users.me.invalidate();
    }
  });

  const revokeBadge = trpc.badges.revoke.useMutation({
    onSuccess: (data) => {
      utils.users.me.invalidate();
    }
  });

  return {
    userBadges: user?.credentials || [],
    isLoading: isLoading.user,
    createBadge: createBadge.mutate,
    revokeBadge: revokeBadge.mutate
  };
};

export const useGetAllBadges = () => {
  return trpc.badges.all.useQuery();
};
