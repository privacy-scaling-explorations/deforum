import { createContext, useContext, ReactNode, useState } from 'react';
import { LoginModal } from '@/sections/Login/LoginModal';

interface GlobalContextType {
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
  children?: ReactNode;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  user?: any;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  showLoginModal: boolean;
  setShowLoginModal: (value: boolean) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const value = {
    isMenuOpen,
    setIsMenuOpen,
    isDarkMode,
    setIsDarkMode,
    isLoggedIn,
    setIsLoggedIn,
    showLoginModal,
    setShowLoginModal,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
      <LoginModal isOpen={showLoginModal} setIsOpen={setShowLoginModal} />
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
}
