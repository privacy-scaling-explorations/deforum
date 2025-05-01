import { trpc } from "../lib/trpc";

export const useGetProfile = ({ username }: { username: string }) => {
  return trpc.users.byUsername.useQuery({ username });
};
