import { Card } from "./Card";
import { Icons } from "../Icons";
import { Avatar } from "../Avatar";
import { cn } from "@/lib/utils";
import { router } from "@/lib/router";
import { CommunityType, CommunityTypeIconMapping } from "./../../global";

interface CommunityCardProps {
  slug: string;
  name: string;
  description?: string;
  avatar?: string;
  type?: CommunityType;
  badges?: string[];
  members?: number;
  children?: React.ReactNode;
  hasLink?: boolean;
  
}

export const CommunityCard = ({
  name = "",
  description = "",
  avatar = "",
  type = "open",
  members = 0,
  badges = [],
  children,
  hasLink = true,
  slug,
}: CommunityCardProps) => {

  const Icon = CommunityTypeIconMapping?.[type];
  const hasBadges = badges.length > 0;
  const hasMultipleBadges = badges.length > 1;
  const hasMembers = members > 0;

  return (
    <Card.Base
      spacing="sm"
      className={cn({ "cursor-pointer": hasLink })}
      onClick={() => {
        if (!hasLink) return;
        router.navigate({
          to: `/communities/${slug}`,
        });
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-[6px]">
            <Avatar src={avatar} />
            <div className="flex flex-col">
              <span className="font-inter text-base font-semibold text-card-foreground leading-6">
                {name}
              </span>
              <div className="flex gap-1 items-center">
                {Icon && <Icon />}
                {(hasMembers || hasBadges) && (
                  <span className="text-purple">·</span>
                )}
                {hasMembers && (
                  <>
                    <span className="font-inter text-purple text-xs font-medium leading-none">
                      {members} members
                    </span>
                    <span className="text-purple">·</span>
                  </>
                )}
                {hasBadges && (
                  <div className="flex items-center gap-1">
                    <div className="border border-purple rounded-[12px] px-2 py-0.5 flex items-center justify-center text-xs text-purple leading-none">
                      {badges[0]}
                    </div>
                  </div>
                )}
                {hasMultipleBadges && (
                  <span className="font-inter text-xs text-purple font-medium">
                    +{badges.length - 1}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="font-inter text-xs font-normal text-base-muted-foreground line-clamp-2 min-h-8">
            {description}
          </span>
        </div>
        {children}
      </div>
    </Card.Base>
  );
};
