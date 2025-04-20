import { Header } from "@/components/Header";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { cn } from "@/lib/utils";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginModal } from "@/sections/Login/LoginModal";
import { AppVersion } from "../ui/AppVersion";
import { LeftSidebar } from "./LeftSidebar";
interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showLeftSidebar?: boolean;
  showRightSidebar?: boolean;
}

export const MainLayout = ({
  children,
  showHeader = false,
  showLeftSidebar = false,
  showRightSidebar = false,
}: MainLayoutProps) => {
  const { isMenuOpen, setIsMenuOpen, isDarkMode, showLoginModal, setShowLoginModal } = useGlobalContext();

  const router = useRouter();

  const pathname = router?.latestLocation?.href;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const hasBothSidebars = showLeftSidebar && showRightSidebar;

  return (
    <div className={cn("h-screen", isDarkMode ? "dark" : "")}>
      <LoginModal isOpen={showLoginModal} setIsOpen={setShowLoginModal} />
      {showHeader && <Header />}
      <main className="bg-base-background h-[calc(100vh-65px)] flex justify-between overflow-hidden">
        {showLeftSidebar && <LeftSidebar />}
        {children && (
          <div
            className={cn(
              "flex-1",
              isMenuOpen ? "overflow-y-hidden" : "overflow-y-scroll",
            )}
          >
            {children}
            {!hasBothSidebars && <AppVersion />}
          </div>
        )}
        {showRightSidebar && (
          <div className="mr-6 pt-6 hidden lg:block">
            {!hasBothSidebars && <AppVersion />}
          </div>
        )}
      </main>
    </div>
  );
};
