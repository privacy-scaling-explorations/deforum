import { trpc } from "../lib/trpc";

export const useGetCommunities = () => {
  return trpc.communities.all.useQuery();
};

export const useGetUserCommunities = () => {
  return trpc.communities.listByUser.useQuery();
};

export const useGetCommunityById = (id: string) => {
  return trpc.communities.byId.useQuery(id);
};

export const useGetCommunityPosts = (id: string) => {
  return trpc.communities.posts.useQuery({ id });
};

export const useJoinCommunity = () => {
  return trpc.communities.join.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries
      trpc.communities.all.invalidate();
    },
  });
};
