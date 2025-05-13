import { Bell, Settings, LucideIcon, Users, Home, Award } from 'lucide-react';

// TODO Check that `requiresAuth` functions correctly

export const MAIN_NAV_ITEMS: Record<
  'start' | 'end',
  Array<{
    title: string;
    to: string;
    icon: LucideIcon;
    requiresAuth: boolean;
    badge?: string;
  }>
> = {
  start: [
    { title: 'navigation.home', to: '/', icon: Home, requiresAuth: false },
    { title: 'pages.badges.title', to: '/badges', icon: Award, requiresAuth: true },
    {
      title: 'pages.notifications.title',
      to: '/notifications',
      icon: Bell,
      requiresAuth: true
    },
    {
      title: 'pages.communities.title',
      to: '/communities',
      icon: Users,
      requiresAuth: false
    }
  ],
  end: [{ title: 'navigation.settings', to: '/settings', icon: Settings, requiresAuth: true }]
};

export const LOCAL_STORAGE_KEYS = {
  APP_ID: 'pse-form',
  POST_DRAFT: 'post-draft'
};

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
