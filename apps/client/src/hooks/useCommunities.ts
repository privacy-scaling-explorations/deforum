import { trpc } from "../lib/trpc";

export const useGetCommunities = () => {
  return trpc.communities.all.useQuery();
};


export const useGetCommunityById = (id: string) => {
  return trpc.communities.byId.useQuery(id);
};

export const useGetCommunityBySlug = (slug: string) => {
  return trpc.communities.bySlug.useQuery(slug);
};

export const useJoinCommunity = () => {
  return trpc.communities.join.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries
      trpc.communities.all.invalidate();
    },
  });
};
