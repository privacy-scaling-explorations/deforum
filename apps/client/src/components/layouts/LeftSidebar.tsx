/// <reference types="react" />

import React from "react";
import { Link } from "@tanstack/react-router";
import { useGetUser } from "@/hooks/useAuth";
import { LucideIcon, SunIcon, MoonIcon, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Switch } from "@/components/inputs/Switch";
import { MAIN_NAV_ITEMS } from "@/settings";
import { Accordion } from "@/components/Accordion";
import { useSignout } from "@/hooks/useSignout";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import type { MouseEvent } from "react";
import { LanguageSwitcher } from "../LanguageSwitcher";

// Define types for community object
interface Community {
  id: string;
  name: string;
  slug: string;
  avatar?: string | null;
}

const renderNavItems = (
  _items: (typeof MAIN_NAV_ITEMS)[keyof typeof MAIN_NAV_ITEMS],
  isLoggedIn: boolean
) => {
  const { t } = useTranslation();
  return _items.map((item) => {
    const isVisible = item.requiresAuth
      ? isLoggedIn
      : item.requiresAuth === false;

    return (
      isVisible && (
        <NavItem
          to={item.to}
          title={t(item.title)}
          icon={item.icon}
          badge={item.badge}
        />
      )
    );
  });
};

const renderStartItems = (isLoggedIn: boolean) =>
  renderNavItems(MAIN_NAV_ITEMS.start, isLoggedIn);
const renderEndItems = (isLoggedIn: boolean) =>
  renderNavItems(MAIN_NAV_ITEMS.end, isLoggedIn);

export const NavItem = ({
  title,
  to,
  icon,
  badge,
  onClick,
}: {
  title: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  onClick?: () => void;
}) => {
  const Icon = icon;

  return (
    <Link
      to={to}
      onClick={(e: MouseEvent) => {
        onClick?.();
      }}
      className={cn(
        "text-sm font-inter font-medium leading-5 text-base-muted-foreground cursor-pointer outline-none focus:outline-none focus:ring-0 focus:ring-offset-0",
        "duration-200 hover:bg-muted hover:text-base-primary hover:bg-base-muted",
        "flex items-center gap-2 rounded-md h-9 py-2 w-full p-2"
      )}
    >
      <div className="flex items-center gap-2 h-5">
        <Icon className="text-base text-base-foreground" size={16} />
        <span className="font-sans font-medium text-base-muted-foreground text-sm">
          {title}
        </span>
      </div>
      {badge && (
        <div className="ml-auto">
          <Badge variant="secondary" rounded="full">
            {badge}
          </Badge>
        </div>
      )}
    </Link>
  );
};

const SidebarContent = () => {
  const {
    data: user,
    isLoading: userIsLoading,
    isError: userIsError,
  } = useGetUser();
  const { data: communities } = trpc.communities.all.useQuery();
  const isLoggedIn = !!user && !userIsLoading && !userIsError;
  const signout = useSignout();
  const { t } = useTranslation();

  return (
    <nav
      aria-label="Sidebar Navigation"
      className="flex flex-col divide-y-[1px] divide-sidebar-border"
    >
      <div className="space-y-1 pb-6">{renderStartItems(isLoggedIn)}</div>
      <Accordion
        className="py-6"
        items={[
          {
            label: t("sidebar.joined_communities"),
            children: (
              <div className="flex flex-col">
                {user?.communities?.map(
                  ([cid, name, slug]: [string, string, string]) => (
                    <Link
                      key={cid}
                      to="/communities/$slug"
                      className="flex gap-2 items-center py-2 px-3"
                      params={{ slug }}
                    >
                      <Avatar className="!size-[32px] !rounded-lg" src={""} />
                      <span className="font-semibold font-inter text-sm text-sidebar-foreground line-clamp-1">
                        {name}
                      </span>
                    </Link>
                  )
                )}
              </div>
            ),
          },
        ]}
      />

      {isLoggedIn && user.communities && (
        <div className="space-y-2 py-6">
          <div className="w-full justify-start flex items-center space-x-3 text-sm">
            <Users className="w-5 h-5" />
            <span>{t("sidebar.joined_communities")} 1</span>
          </div>

          {user.communities.map(
            ([cid, name, slug]: [string, string, string]) => (
              <Link key={cid} to="/communities/$slug" params={{ slug }}>
                <Button
                  className="w-full justify-start flex items-center space-x-2"
                  variant="ghost"
                >
                  <span>{name}</span>
                </Button>
              </Link>
            )
          )}
        </div>
      )}

      <div className="space-y-1 py-6">
        {renderEndItems(isLoggedIn)}
        <NavItem
          title={t("actions.logout")}
          to="/"
          icon={LogOut}
          onClick={() => signout()}
        />
      </div>
    </nav>
  );
};

const LeftSidebar = () => {
  const {
    data: user,
    isLoading: userIsLoading,
    isError: userIsError,
  } = useGetUser();
  const { isDarkMode, setIsDarkMode } = useGlobalContext();
  const signout = useSignout();
  const { data: communities } = trpc.communities.all.useQuery();
  const { t } = useTranslation();

  const isLoggedIn = !!user && !userIsLoading && !userIsError;

  return (
    <aside className="h-full w-[264px] p-6 bg-sidebar-background hidden flex-col sticky top-[60px] z-[49] lg:flex ">
      <nav aria-label="Sidebar Navigation" className="flex flex-col h-full">
        <div className="divide-y-[1px] divide-sidebar-border">
          <div className="space-y-1 pb-6">{renderStartItems(isLoggedIn)}</div>

          {isLoggedIn && user.communities && (
            <Accordion
              className="py-6"
              items={[
                {
                  label: t("sidebar.joined_communities"),
                  children: (
                    <div className="flex flex-col">
                      {communities?.map((community: Community) => (
                        <Link
                          key={community.id}
                          to="/communities/$slug"
                          className="flex gap-2 items-center p-2"
                          params={{ slug: community.slug }}
                        >
                          <Avatar
                            className="!size-[32px] !rounded-lg"
                            src={community.avatar || ""}
                          />
                          <span className="font-semibold font-inter text-sm text-sidebar-foreground line-clamp-1">
                            {community.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>

        <div className="space-y-1 mt-auto">
          <LanguageSwitcher />
          <div className="flex gap-2.5 items-center px-2 h-5">
            <SunIcon
              className="size-4 text-base-muted-foreground"
              aria-label={t("sidebar.theme.light")}
            />
            <Switch
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
              aria-label={t("sidebar.theme.toggle")}
            />
            <MoonIcon
              className="size-4 text-base-muted-foreground"
              aria-label={t("sidebar.theme.dark")}
            />
          </div>
        </div>
      </nav>
    </aside>
  );
};

LeftSidebar.Content = SidebarContent;

export { LeftSidebar };
