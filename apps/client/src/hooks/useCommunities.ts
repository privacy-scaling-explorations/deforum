import { useGlobalContext } from '@/contexts/GlobalContext';
import { trpc } from '@/lib/trpc';

// Hook for reading all communities
export const useGetAllCommunities = () => {
  return trpc.communities.all.useQuery();
};

// Hook for managing user's joined communities
export const useUserCommunities = () => {
  const { user, isLoading } = useGlobalContext();
  const utils = trpc.useUtils();

  const { data: userCommunities } = trpc.communities.byUser.useQuery(user?.id || '', {
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });

  const joinMutation = trpc.communities.join.useMutation({
    onSuccess: () => {
      utils.users.me.invalidate();
      if (user?.id) {
        utils.communities.byUser.invalidate(user.id);
      }
    }
  });

  const leaveMutation = trpc.communities.leave.useMutation({
    onSuccess: () => {
      utils.users.me.invalidate();
      if (user?.id) {
        utils.communities.byUser.invalidate(user.id);
      }
    }
  });

  return {
    joinedCommunities: userCommunities || [],
    isLoading: isLoading.user,
    joinCommunity: joinMutation.mutate,
    leaveCommunity: leaveMutation.mutate
  };
};

export const useJoinCommunity = () => {
  const { joinCommunity, isLoading } = useUserCommunities();
  return {
    mutate: joinCommunity,
    isPending: isLoading
  };
};

export const useGetCommunityBySlug = (slug: string) => {
  return trpc.communities.bySlug.useQuery(slug);
};
