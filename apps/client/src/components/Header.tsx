import { Link } from "@tanstack/react-router";
import { Input } from "@/components/inputs/Input";
import { Profile } from "@/components/Profile";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Menu as MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useTranslation } from 'react-i18next';
import { X as CloseIcon } from "lucide-react";
import { LeftSidebar } from "@/components/layouts/LeftSidebar";
import { LanguageSwitcher } from "./LanguageSwitcher";

const DesktopNav = () => {
  const { t } = useTranslation();
  
  return (
    <div className="hidden lg:flex items-center justify-between gap-5 lg:gap-0 px-5 py-3">
      <Link to="/" className="hidden lg:flex">
        <h1>
          <span className="font-space-grotesk font-bold text-base-logo text-[26px] leading-[25px]">
            {t('brand.prefix')}
          </span>
          <span className="font-space-grotesk text-base-logo font-normal text-[26px] leading-[25px] tracking-[-1px]">
            {t('brand.name')}
          </span>
        </h1>
      </Link>

      <div className="flex flex-col items-start gap-2 w-[486px]">
        <div className="relative w-full">
          <Input placeholder={t('header.search_placeholder')} icon={Search} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Profile />
      </div>
    </div>
  );
};

const MobileNav = () => {
  const { isMenuOpen, setIsMenuOpen } = useGlobalContext();
  const { t } = useTranslation();
  
  return (
    <>
      <div
        className={cn(
          "inset-0 bg-black duration-300",
          isMenuOpen ? "fixed opacity-80 z-40" : "opacity-0 z-[-10]"
        )}
        onClick={() => setIsMenuOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 p-6 left-0 z-50 w-[320px] bg-base-background transform transition-transform duration-300 ease-in-out lg:hidden",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <h1 className="flex gap-1">
                <span className="font-space-grotesk font-bold text-logo-base text-xl leading-[20px]">
                  {t('brand.prefix')}
                </span>
                <span className="font-space-grotesk text-logo-base font-normal text-base leading-[18px] tracking-[-1px] mt-auto">
                  {t('brand.name')}
                </span>
              </h1>
            </Link>
            <button 
              onClick={() => setIsMenuOpen(false)}
              aria-label={t('header.menu.close')}
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
          <LeftSidebar.Content />
        </div>
      </div>

      <div className="flex lg:hidden items-center justify-between gap-5 lg:gap-0 px-4 py-3">
        <Button
          className="flex lg:hidden"
          variant="outline"
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
          }}
          aria-label={t('header.menu.open')}
        >
          <MenuIcon className="size-4" />
        </Button>

        <div className="flex flex-col items-start gap-2 w-[486px]">
          <div className="relative w-full">
            <Input placeholder={t('header.search_placeholder')} icon={Search} />
          </div>
        </div>

        <div className="flex gap-2 ml-auto">
          <LanguageSwitcher />
          <Profile />
        </div>
      </div>
    </>
  );
};

export function Header() {
  return (
    <nav className="bg-base-background border-b-[1px] border-b-base-border sticky top-0 z-50">
      <DesktopNav />
      <MobileNav />
    </nav>
  );
}
