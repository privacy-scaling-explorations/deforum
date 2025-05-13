import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { LoginModal } from '@/sections/Login/LoginModal'
import { trpc } from '@/lib/trpc'
import type { User } from '@/shared/schemas/user'

interface GlobalContextType {
  isMenuOpen: boolean
  setIsMenuOpen: (value: boolean) => void
  children?: ReactNode
  isDarkMode: boolean
  setIsDarkMode: (value: boolean) => void
  user: User | null
  setUser: (user: User | null) => void
  isLoggedIn: boolean
  setIsLoggedIn: (value: boolean) => void
  showLoginModal: boolean
  setShowLoginModal: (value: boolean) => void
  isLoading: {
    user: boolean
  }
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined)

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Initialize dark mode from local storage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage first
    const storedPreference = localStorage.getItem('darkMode')
    if (storedPreference !== null) {
      return storedPreference === 'true'
    }
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('token')
    return !!token
  })
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Global state
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState({
    user: false
  })

  // Fetch user data
  console.debug('Global Context fetching userData')
  const { data: userData, isLoading: isUserLoading } = trpc.users.me.useQuery(undefined, {
    enabled: isLoggedIn
  })

  // Update user data when query completes
  useEffect(() => {
    if (userData) {
      setUser(userData as any)
    }
  }, [userData])

  // Update loading states
  useEffect(() => {
    setIsLoading({
      user: isUserLoading
    })
  }, [isUserLoading])

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't explicitly set a preference
      if (localStorage.getItem('darkMode') === null) {
        setIsDarkMode(e.matches)
      }
    }

    // Add event listener
    mediaQuery.addEventListener('change', handleChange)

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString())
  }, [isDarkMode])

  const value = {
    isMenuOpen,
    setIsMenuOpen,
    isDarkMode,
    setIsDarkMode,
    user,
    setUser,
    isLoggedIn,
    setIsLoggedIn,
    showLoginModal,
    setShowLoginModal,
    isLoading
  }

  return (
    <GlobalContext.Provider value={value}>
      {children}
      <LoginModal isOpen={showLoginModal} setIsOpen={setShowLoginModal} />
    </GlobalContext.Provider>
  )
}

export function useGlobalContext() {
  const context = useContext(GlobalContext)
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalProvider')
  }
  return context
}
