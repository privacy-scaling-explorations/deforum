import { Bell, Settings, LucideIcon, Users, User } from "lucide-react";


export const MAIN_NAV_ITEMS: Record<
  "start" | "end",
  Array<{ title: string; to: string; icon: LucideIcon; requiresAuth: boolean; badge?: string }>
> = {
  start: [
    { title: "My Badges", to: "/badges", icon: Settings, requiresAuth: true },
    { title: "Communities", to: "/communities", icon: Users, requiresAuth: true },
    { title: "Notifications", to: "/notifications", icon: Bell, requiresAuth: true, badge: "10" },
    { title: "Profile", to: "/profile", icon: User, requiresAuth: true },
  ],
  end: [{ title: "Settings", to: "/settings", icon: Settings, requiresAuth: true }],
};

export const LOCAL_STORAGE_KEYS = {
  APP_ID: "pse-form",
  POST_DRAFT: "post-draft",
}

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';