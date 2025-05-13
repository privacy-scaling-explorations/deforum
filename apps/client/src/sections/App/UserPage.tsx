import { PageContent } from "@/components/PageContent"
import { useGetProfile } from "@/hooks/useProfile"
import { useParams } from "@tanstack/react-router"
import { Avatar } from "@/components/Avatar"
import { formatDate } from "@/lib/utils"
import {
  PencilLine as PencilIcon,
  FileBadge as FileBadgeIcon,
  CircleUser as CircleUserIcon,
  FileText as FileTextIcon,
} from "lucide-react"
import { InfoCard } from "@/components/ui/InfoCard"
import { Card } from "@/components/cards/Card"
import { Badge } from "@/components/ui/Badge"
import { ProfilePostItems } from "./ProfilePostItems"
import { useTranslation } from "react-i18next"
import { BadgeCredential } from "@/shared/schemas/badge"

interface ProfileBadge {
  id: string
  name: string
}

export function UserPage() {
  const userParams = useParams({ from: "/_left-sidebar/user/$username" })
  const username = userParams.username
  const { data: profile, isLoading } = useGetProfile(username)
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <PageContent>
        <div>Loading...</div>
      </PageContent>
    )
  }

  if (!profile) {
    return (
      <PageContent>
        <div>User not found</div>
      </PageContent>
    )
  }

  const hasBadges = profile.credentials && profile.credentials.length > 0

  return (
    <PageContent>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Avatar src={profile.avatar || ""} size="xl" />
            <div className="flex flex-col gap-[6px]">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <div className="flex items-center gap-2">
                <CircleUserIcon className="size-4 text-base-muted-foreground" />
                <span className="text-base-muted-foreground font-inter font-normal text-sm">
                  {profile.activePublicKey ? `Public Key: ${profile.activePublicKey.publicKey}` : 'No public key'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PencilIcon className="size-4 text-base-muted-foreground" />
                <span className="text-base-muted-foreground font-inter font-normal text-sm">
                  Created {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-base-muted-foreground font-inter font-normal text-sm">
              {profile.bio || 'No bio'}
            </span>
          </div>
          <div className="flex gap-10">
            <InfoCard
              label={t("pages.profile.stats.posts")}
              value={profile._count.posts}
              variant="base"
              fontSize="lg"
            />
            <InfoCard
              label={t("pages.profile.stats.comments")}
              value={profile._count.replies}
              variant="base"
              fontSize="lg"
            />
            <InfoCard
              label={t("pages.profile.stats.communities")}
              value={profile.communities?.length || 0}
              variant="base"
              fontSize="lg"
            />
            <InfoCard
              label={t("pages.profile.stats.badges")}
              value={profile._count.credentials}
              variant="base"
              fontSize="lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card.Base>
              <div className="flex flex-col gap-6">
                <div className="flex gap-1 items-center">
                  <FileTextIcon className="size-5 text-base-foreground" />
                  <span className="font-semibold text-base-foreground text-xl">
                    {t("pages.profile.posts.title", "Posts")}
                  </span>
                </div>
                <ProfilePostItems userId={profile.id} username={profile.username} />
              </div>
            </Card.Base>
          </div>

          <div className="lg:col-span-1">
            <Card.Base spacing="sm">
              <div className="flex flex-col gap-3">
                <div className="flex gap-1 items-center">
                  <FileBadgeIcon className="size-5 text-base-foreground" />
                  <span className="font-semibold text-base-foreground text-xl">
                    {t("pages.profile.badges.title", `${profile.username}'s Badges`)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hasBadges ? (
                    profile.credentials.map((credential) => (
                      <div key={credential.id}>
                        <Badge variant="secondary">{credential.definition.name}</Badge>
                      </div>
                    ))
                  ) : (
                    <span className="text-base-muted-foreground font-inter font-normal text-sm">
                      {t("pages.profile.badges.empty", "No badges yet")}
                    </span>
                  )}
                </div>
              </div>
            </Card.Base>
          </div>
        </div>
      </div>
    </PageContent>
  )
}
