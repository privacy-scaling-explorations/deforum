import { PageContent } from "@/components/PageContent";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { CommunityCard } from "@/components/cards/CommunityCard";
import { classed } from "@tw-classed/react";
import { useGetCommunities } from "@/hooks/useCommunities";
import { Button } from "@/components/ui/Button";
import {
  Settings as SettingsIcon,
  UserRoundCheck as JoinedIcon,
  UserRoundPlus as JoinIcon,
  Plus as PlusIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

const CommunityWrapper = classed.div("flex flex-col gap-3");
const CommunityTitle = classed.h3(
  "font-inter text-base font-semibold text-base-foreground leading-8"
);
const CommunityGrid = classed.div("grid grid-cols-1 lg:grid-cols-3 gap-6");

enum CommunityTabs {
  All = "all",
  Mod = "mod",
  Joined = "joined",
}

const getCommunityType = (community: any) => {
  if (community?.isPrivate) return "private";
  if (community?.isGated) return "gated";
  return "open";
};

export const CommunitiesPage = () => {
  const { isLoggedIn } = useGlobalContext();

  const { data: communities = [] } = useGetCommunities();

  return (
    <PageContent
      title="Explore Communities"
      actions={
        <Link to="/communities/create">
          <Button icon={PlusIcon} size="xs">
            Create Community
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col gap-10">
        <CommunityWrapper>
          <CommunityTitle>My Communities</CommunityTitle>
          <CommunityGrid>
            {communities.map((community: any) => (
              <CommunityCard
                key={community.id}
                slug={community.slug}
                name={community.name}
                avatar={community.avatar}
                badges={community.requiredBadges.map(
                  (item: any) => item.badge.name
                )}
                description={community.description}
                type={getCommunityType(community)}
                members={community.members ?? 0}
              >
                <Button
                  className="ml-auto mt-auto"
                  variant="outline"
                  size="xs"
                  icon={SettingsIcon}
                >
                  Manage
                </Button>
              </CommunityCard>
            ))}
          </CommunityGrid>
        </CommunityWrapper>

        <CommunityWrapper>
          <CommunityTitle>Joined Communities</CommunityTitle>
          <CommunityGrid>
            {communities.map((community: any) => (
              <CommunityCard
                key={community.id}
                slug={community.slug}
                name={community.name}
                avatar={community.avatar}
                badges={community.badges}
                description={community.description}
                type={getCommunityType(community)}
                members={community.members ?? 0}
              >
                <Button
                  className="ml-auto mt-auto"
                  variant="secondary"
                  size="xs"
                  icon={JoinedIcon}
                  disabled
                >
                  Joined
                </Button>
              </CommunityCard>
            ))}
          </CommunityGrid>
        </CommunityWrapper>

        <CommunityWrapper>
          <CommunityTitle>Trending</CommunityTitle>
          <CommunityGrid>
            {communities.map((community: any) => (
              <CommunityCard
                key={community.id}
                slug={community.slug}
                name={community.name}
                avatar={community.avatar}
                badges={community.badges}
                description={community.description}
                type={getCommunityType(community)}
                members={community.members ?? 0}
              >
                <Button className="ml-auto mt-auto" size="xs" icon={JoinIcon}>
                  Join
                </Button>
              </CommunityCard>
            ))}
          </CommunityGrid>
        </CommunityWrapper>
      </div>
    </PageContent>
  );
};
