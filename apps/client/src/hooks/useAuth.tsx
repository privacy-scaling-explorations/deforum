import { useMutation, useQuery } from "@tanstack/react-query"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { API_URL } from "../settings"

export function useMockAuth({ onSuccess }: { onSuccess?: () => void } = {}) {
  const { setIsLoggedIn } = useGlobalContext()

  return useMutation({
    mutationFn: () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setIsLoggedIn(true)
          resolve()
          onSuccess?.()
        }, 1000)
      })
    },
  })
}

export function useGetUser() {
  const { isLoggedIn } = useGlobalContext();
  return useQuery({
    enabled: isLoggedIn,
    queryKey: ["getUser"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/me`)
      return response.json()
    },
  })
}