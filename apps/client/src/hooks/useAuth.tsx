import { useGlobalContext } from "@/contexts/GlobalContext";
import { trpc } from "../lib/trpc";

export function useMockAuth({ onSuccess }: { onSuccess?: () => void } = {}) {
  const { setIsLoggedIn } = useGlobalContext();

  return trpc.auth.mock.useMutation({
    onSuccess: () => {
      setIsLoggedIn(true);
      onSuccess?.();
    },
  });
}

export function useGetUser() {
  const { isLoggedIn } = useGlobalContext();
  return trpc.users.me.useQuery(undefined, {
    enabled: isLoggedIn,
  });
}