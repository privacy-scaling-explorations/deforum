import { useGlobalContext } from "@/contexts/GlobalContext";
import { trpc } from "../lib/trpc";

export function useGetUser() {
  return trpc.users.me.useQuery();
}

export function useSignIn() {
  const { setIsLoggedIn } = useGlobalContext();

  return trpc.auth.signIn.useMutation({
    onSuccess: () => {
      setIsLoggedIn(true);
    },
  });
}

export function useSignUp() {
  const { setIsLoggedIn } = useGlobalContext();

  return trpc.auth.signUp.useMutation({
    onSuccess: () => {
      setIsLoggedIn(true);
    },
  });
}