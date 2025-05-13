import { Card } from "@/components/cards/Card"
import { PageContent } from "@/components/PageContent"
import { Button } from "@/components/ui/Button"
import { Link } from "@tanstack/react-router"
import { classed } from "@tw-classed/react"
import { PlusIcon } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { BadgeCredential } from '@/shared/schemas/badge'
import { Tooltip } from "@/components/ui/Tooltip"
import { useTranslation } from "react-i18next"

const RowSection = classed.div("grid grid-cols-[1fr_1fr_1fr_130px_1fr] gap-2")

export const MyBadgesPage = () => {
  const { user } = useGlobalContext()
  const userBadges = user?.credentials || []
  const { t } = useTranslation()

  return (
    <PageContent
      title={t('pages.badges.title')}
      description={t('pages.badges.description')}
    >
      <div className="flex flex-col gap-2">
        <Card.Base spacing="sm">
          <RowSection className="h-2">
            <span className="text-sm font-medium text-base-muted-foreground">
              {t('pages.badges.headers.badge')}
            </span>
            <span className="text-sm font-medium text-base-muted-foreground">
              {t('pages.badges.headers.protocol')}
            </span>
            <span className="text-sm font-medium text-base-muted-foreground">
              {t('pages.badges.headers.visibility')}
            </span>
            <span className="text-sm font-medium text-base-muted-foreground">
              {t('pages.badges.headers.verified')}
            </span>
            <span className="text-sm font-medium text-base-muted-foreground"></span>
          </RowSection>
          {userBadges.map((credential: BadgeCredential) => (
            <RowSection key={credential.id} className="items-center">
              <span className="text-sm">{credential.definition.name}</span>
              <div className="flex gap-2">
                {credential.definition.protocols?.map((protocolBadge) => (
                  <Badge key={protocolBadge.id} variant="secondary">
                    {protocolBadge.protocol.name}
                  </Badge>
                ))}
              </div>
              <span className="text-sm">
                {credential.isPublic ? t('pages.badges.visibility.public') : t('pages.badges.visibility.private')}
              </span>
              <span className="text-sm">
                {new Date(credential.verifiedAt || credential.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <Tooltip content="Delete functionality will be implemented later">
                  <Button variant="destructive" size="sm" disabled>
                    {t('pages.badges.actions.delete')}
                  </Button>
                </Tooltip>
              </div>
            </RowSection>
          ))}
          <Link to="/badges/new">
            <Button icon={PlusIcon} className="w-fit">
              {t('pages.badges.actions.add_new')}
            </Button>
          </Link>
        </Card.Base>
      </div>
    </PageContent>
  )
}
