import { Link } from "@tanstack/react-router"
import { useGetUser } from "@/hooks/useAuth"
import { LucideIcon, SunIcon, MoonIcon, Users, LogOut, Award } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/Avatar"
import { Badge } from "@/components/ui/Badge"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { AuthWrapper } from "@/components/AuthWrapper"
import { Switch } from "@/components/inputs/Switch"
import { MAIN_NAV_ITEMS } from "@/settings"
import { Accordion } from "@/components/Accordion"
import { useSignout } from "@/hooks/useSignout"
import { useTranslation } from 'react-i18next'
import { useUserCommunities } from "@/hooks/useCommunities"

const renderNavItems = (
  _items: (typeof MAIN_NAV_ITEMS)[keyof typeof MAIN_NAV_ITEMS],
  isLoggedIn: boolean
) => {
  const { t } = useTranslation()
  console.log('Rendering nav items', { isLoggedIn, _items })
  return _items.map((item) => {
    const isVisible = item.requiresAuth
      ? isLoggedIn
      : item.requiresAuth === false

    console.debug(`Nav item "${item.title}" isVisible: ${isVisible}, requiresAuth: ${item.requiresAuth}`)

    return (
      isVisible && (
        <NavItem
          to={item.to}
          key={item.title}
          title={t(item.title)}
          icon={item.icon}
          badge={item.badge}
        />
      )
    )
  })
}

const renderStartItems = (isLoggedIn: boolean) =>
  renderNavItems(MAIN_NAV_ITEMS.start, isLoggedIn)
const renderEndItems = (isLoggedIn: boolean) =>
  renderNavItems(MAIN_NAV_ITEMS.end, isLoggedIn)

export const NavItem = ({
  title,
  to,
  icon,
  badge,
  onClick,
}: {
  title: string
  to: string
  icon: LucideIcon
  badge?: string
  onClick?: () => void
}) => {
  const Icon = icon

  return (
    <Link
      to={to}
      key={title}
      onClick={(e) => {
        onClick?.()
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
          <Badge rounded="full" className="!ml-auto">
            {badge}
          </Badge>
        </div>
      )}
    </Link>
  )
}

const SidebarContent = () => {
  const {
    data: user,
    isLoading: userIsLoading,
    isError: userIsError,
  } = useGetUser()
  const isLoggedIn = !!user && !userIsLoading && !userIsError
  const signout = useSignout()
  const { t } = useTranslation()

  return (
    <nav
      aria-label="Sidebar Navigation"
      className="flex flex-col divide-y-[1px] divide-sidebar-border"
    >
      <div className="space-y-1 pb-6">{renderStartItems(isLoggedIn)}</div>

      {/* Debug: Forced badges link */}
      <NavItem
        to="/badges"
        key="debug-badges"
        title={t('pages.badges.debug_title')}
        icon={Award}
      />

      <div className="space-y-1 py-6">
        {renderEndItems(isLoggedIn)}
        <NavItem
          title={t('actions.logout')}
          to="/"
          icon={LogOut}
          onClick={() => signout.signOut()}
        />
      </div>
    </nav>
  )
}

const LeftSidebar = () => {
  const {
    data: user,
    isLoading: userIsLoading,
    isError: userIsError,
  } = useGetUser()
  console.debug('LeftSidebar user data:', { user, userIsLoading, userIsError })
  const { isDarkMode, setIsDarkMode } = useGlobalContext()
  const signout = useSignout()
  const { t } = useTranslation()
  const { joinedCommunities } = useUserCommunities()

  const isLoggedIn = !!user && !userIsLoading && !userIsError

  return (
    <aside className="h-full w-[264px] p-6 bg-sidebar-background hidden flex-col sticky top-[60px] z-[49] lg:flex ">
      <nav aria-label="Sidebar Navigation" className="flex flex-col h-full">
        <div className="divide-y-[1px] divide-sidebar-border">
          <div className="space-y-1 pb-6">{renderStartItems(isLoggedIn)}</div>

          <AuthWrapper>
            <Accordion
              className="py-6"
              items={[
                {
                  label: t('sidebar.my_communities'),
                  children: (
                    <div className="flex flex-col">
                      {!joinedCommunities?.length ? (
                        <div className="px-3 py-2 text-sm text-base-muted-foreground">
                          {t('sidebar.no_communities')}
                        </div>
                      ) : (
                        joinedCommunities.map((data) => (
                          <Link
                            key={data.communityId}
                            to="/communities/$slug"
                            className="flex gap-2 items-center py-2 px-3"
                            params={{ slug: data.community?.slug }}
                          >
                            <Avatar
                              className="!size-[32px] !rounded-lg"
                              src={data.community?.avatar || ""}
                              username={data.community?.name}
                              linkToSettings={false}
                            />
                            <span className="font-semibold font-inter text-sm text-sidebar-foreground line-clamp-1">
                              {data.community?.name}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </AuthWrapper>
        </div>

        <div className="space-y-1 mt-auto">
          <div className="flex gap-2.5 items-center px-2 h-5">
            <SunIcon
              className="size-4 text-base-muted-foreground"
              aria-label={t('sidebar.theme.light')}
            />
            <Switch
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
              aria-label={t('sidebar.theme.toggle')}
            />
            <MoonIcon
              className="size-4 text-base-muted-foreground"
              aria-label={t('sidebar.theme.dark')}
            />
          </div>
        </div>
      </nav>
    </aside>
  )
}

LeftSidebar.Content = SidebarContent

export { LeftSidebar }
