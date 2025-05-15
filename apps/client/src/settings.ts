import { Bell, Settings, LucideIcon, Users, Home } from "lucide-react";

interface MainNavItem {
  title: string;
  to: string;
  icon: LucideIcon;
  requiresAuth: boolean;
  onClick?: () => void;
  badge?: string;
  items?: MainNavItem[];
}

export const MAIN_NAV_ITEMS: Record<"start" | "end", MainNavItem[]> = {
  start: [
    { title: "navigation.home", to: "/", icon: Home, requiresAuth: false },
    {
      title: "pages.badges.title",
      to: "/badges",
      icon: Settings,
      requiresAuth: true,
    },
    {
      title: "pages.notifications.title",
      to: "/notifications",
      icon: Bell,
      requiresAuth: true,
    },
    {
      title: "pages.communities.title",
      to: "/communities",
      icon: Users,
      requiresAuth: false,
    },
  ],
  end: [
    {
      title: "navigation.settings",
      to: "/settings",
      icon: Settings,
      requiresAuth: true,
    },
  ],
};

export const LOCAL_STORAGE_KEYS = {
  APP_ID: "pse-form",
  POST_DRAFT: "post-draft",
};

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
