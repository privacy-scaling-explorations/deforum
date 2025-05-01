import { Card } from "@/components/cards/Card";
import { PageContent } from "@/components/PageContent";
import { Button } from "@/components/ui/Button";
import { Link } from "@tanstack/react-router";
import { classed } from "@tw-classed/react";
import { PlusIcon } from "lucide-react";
import { useGetBadges } from "@/hooks/useBadges";
import { Badge } from "@/components/ui/Badge";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { BadgeDefinition, ProtocolBadge } from "@deforum/shared/schemas/badge";

interface BadgeWithProtocols extends Omit<BadgeDefinition, 'protocols'> {
  protocols: ProtocolBadge[];
  _count?: {
    issuances: number;
  };
}

const RowSection = classed.div("grid grid-cols-[1fr_1fr_1fr_130px_1fr] gap-2");

export const MyBadgesPage = () => {
  const { data: badges } = useGetBadges();
  const { user } = useGlobalContext();

  return (
    <PageContent
      title="My Badges"
      description="Manage and customize your badges here. You can manage visibility, add new badges, reverify or remove ones you no longer want."
    >
      <div className="flex flex-col gap-4">
        <Card.Base spacing="sm">
          <RowSection className="h-10">
            <span className="text-sm font-medium text-base-muted-foreground">
              Badge
            </span>
            <span className="text-sm font-medium text-base-muted-foreground">
              Protocols
            </span>
            <span className="text-sm font-medium text-base-muted-foreground">
              Visibility
            </span>
            <span className="text-sm font-medium text-base-muted-foreground">
              Verified
            </span>
            <span className="text-sm font-medium text-base-muted-foreground"></span>
          </RowSection>
          {badges?.map((badge: BadgeWithProtocols) => (
            <RowSection key={badge.id} className="items-center">
              <span className="text-sm">{badge.name}</span>
              <div className="flex gap-2">
                {badge.protocols.map((protocolBadge) => (
                  <Badge key={protocolBadge.id} variant="secondary">
                    {protocolBadge.protocol.name}
                  </Badge>
                ))}
              </div>
              <span className="text-sm">
                {badge.privateByDefault ? "Private" : "Public"}
              </span>
              <span className="text-sm">
                {new Date(badge.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </RowSection>
          ))}
          <Link to="/badges/new">
            <Button icon={PlusIcon} className="w-fit">
              Add new badge
            </Button>
          </Link>
        </Card.Base>
      </div>
    </PageContent>
  );
};
