import { trpc } from "../lib/trpc";

export const useGetBadges = () => {
  return trpc.badges.list.useQuery();
};