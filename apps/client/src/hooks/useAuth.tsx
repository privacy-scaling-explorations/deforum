import { useGlobalContext } from "@/contexts/GlobalContext"
import { trpc } from "../lib/trpc"

export const useGetUser = () => {
  const { user, isLoading } = useGlobalContext()
  return { data: user, isLoading: isLoading.user, isError: false }
}

export const useAuth = () => {
  const { user, setUser, setIsLoggedIn, isLoading } = useGlobalContext()
  const utils = trpc.useUtils()

  const signIn = trpc.auth.verifyAuthentication.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('token', data.token)
      setUser(data.user as any)
      setIsLoggedIn(true)
      utils.auth.me.invalidate()
    }
  })

  const signUp = trpc.auth.initiateRegistrationFromUnregisteredPasskey.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('token', data.token)
      setUser(data.user as any)
      setIsLoggedIn(true)
      utils.auth.me.invalidate()
    }
  })
  console.info(`useAuth User:`)
  console.info(user)
  return {
    user,
    isLoading: isLoading.user,
    signIn,
    signUp
  }
}