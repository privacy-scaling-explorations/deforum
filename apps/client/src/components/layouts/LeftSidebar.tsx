import { Link } from "@tanstack/react-router";
import { useGetUser, useMockAuth } from "@/hooks/useAuth";
import { LucideIcon, SunIcon, MoonIcon, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Switch } from "@/components/inputs/Switch";
import { MAIN_NAV_ITEMS } from "@/settings";
import { Accordion } from "@/components/Accordion";
import { useSignout } from "@/hooks/useSignout";

const renderNavItems = (
  _items: (typeof MAIN_NAV_ITEMS)[keyof typeof MAIN_NAV_ITEMS],
  isLoggedIn: boolean
) =>
  _items.map((item) => {
    const isVisible = item.requiresAuth
      ? isLoggedIn
      : item.requiresAuth === false;

    return (
      isVisible && (
        <NavItem
          to={item.to}
          key={item.title}
          title={item.title}
          icon={item.icon}
          badge={item.badge}
        />
      )
    );
  });

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
  const communityMocks = [] as any[];

  return (
    <Link
      to={to}
      key={title}
      onClick={(e) => {
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
          <Badge rounded="full" className="!ml-auto">
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
  const communityMocks = [] as any[];
  const isLoggedIn = !!user && !userIsLoading && !userIsError;
  const signout = useSignout();

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
            label: "MY COMMUNITIES",
            children: (
              <div className="flex flex-col">
                {communityMocks.map(({ id, name, logo }) => (
                  <Link
                    key={id}
                    to="/communities/$id"
                    className="flex gap-2 items-center py-2 px-3"
                    params={{ id: `${id}` }}
                  >
                    <Avatar className="!size-[32px] !rounded-lg" src={logo} />
                    <span className="font-semibold font-inter text-sm text-sidebar-foreground line-clamp-1">
                      {name} ss
                    </span>
                  </Link>
                ))}
              </div>
            ),
          },
        ]}
      />

      {isLoggedIn && user?.memberships && (
        <div className="space-y-2 py-6">
          <div className="w-full justify-start flex items-center space-x-3 text-sm">
            <Users className="w-5 h-5" />
            <span>My Groups</span>
          </div>
          {user.memberships.map(([gid, name]: [string, string]) => (
            <Link
              key={gid}
              to={"/group/$groupId" as any}
              params={{ groupId: gid } as any}
            >
              <Button
                className="w-full justify-start flex items-center space-x-2"
                variant="ghost"
              >
                <span>{name}</span>
              </Button>
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-1 py-6">
        {renderEndItems(isLoggedIn)}
        <NavItem
          title="Logout"
          to="/"
          icon={LogOut}
          onClick={() => {
            signout();
          }}
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
  const { mutate: mockAuthMutate, isPending: mockAuthIsPending } =
    useMockAuth();
  const communityMocks = [] as any[];

  const isLoggedIn = !!user && !userIsLoading && !userIsError;

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
                  label: "MY COMMUNITIES",
                  children: (
                    <div className="flex flex-col">
                      {communityMocks.map(({ id, name, logo }) => (
                        <Link
                          key={id}
                          to="/communities/$id"
                          className="flex gap-2 items-center py-2 px-3"
                          params={{ id: `${id}` }}
                        >
                          <Avatar
                            className="!size-[32px] !rounded-lg"
                            src={logo}
                          />
                          <span className="font-semibold font-inter text-sm text-sidebar-foreground line-clamp-1">
                            {name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </AuthWrapper>
          {isLoggedIn && user?.memberships && (
            <div className="space-y-2 py-6">
              <div className="w-full justify-start flex items-center space-x-3 text-sm">
                <Users className="w-5 h-5" />
                <span>My Groups</span>
              </div>
              {user.memberships.map(([gid, name]: [string, string]) => (
                <Link
                  key={gid}
                  to={"/group/$groupId" as any}
                  params={{ groupId: gid } as any}
                >
                  <Button
                    className="w-full justify-start flex items-center space-x-2"
                    variant="ghost"
                  >
                    <span>{name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1 mt-auto">
          <div className="flex gap-2.5 items-center px-2 h-5">
            <SunIcon className="size-4 text-base-muted-foreground" />
            <Switch
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
            />
            <MoonIcon className="size-4 text-base-muted-foreground" />
          </div>
          {renderEndItems(isLoggedIn)}
          <NavItem
            title="Logout"
            to="/"
            icon={LogOut}
            onClick={() => {
              signout();
            }}
          />
        </div>
      </nav>
    </aside>
  );
};

LeftSidebar.displayName = "LeftSidebar";
LeftSidebar.Content = SidebarContent;

export { LeftSidebar };
