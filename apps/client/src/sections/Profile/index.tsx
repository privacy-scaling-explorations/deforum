import { PageContent } from "@/components/PageContent"
import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { InfoCard } from "@/components/ui/InfoCard"
import { useNavigate } from "@tanstack/react-router"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { useGetUser } from "@/hooks/useAuth"
import { useTranslation } from 'react-i18next'
import { PenLine as PenIcon, LogOut as LogOutIcon } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const ProfilePage = () => {
  const { setIsLoggedIn } = useGlobalContext()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: user, isLoading } = useGetUser()

  if (isLoading) {
    return (
      <PageContent>
        <div>{t('common.loading')}</div>
      </PageContent>
    )
  }

  if (!user) {
    return (
      <PageContent>
        <div>{t('common.user_not_found')}</div>
      </PageContent>
    )
  }

  return (
    <PageContent>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Avatar size="xl" src={user.avatar || ""} />
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold font-inter text-base-foreground">
              {user.username}
            </h2>
            <div className="flex items-center gap-1">
              <span className="text-xs font-inter text-black-secondary">
                {t('pages.profile.user_type')}
              </span>
              <Badge variant="secondary">
                {t('pages.profile.uid_prefix')} {user.publicKey?.[0] || t('pages.profile.no_public_key')}
              </Badge>
            </div>
            <span className="text-xs font-inter text-black-secondary">
              {t('pages.profile.created_prefix')} {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
        <span className="text-sm font-inter text-black-secondary">
          {user.bio || t('pages.profile.no_bio')}
        </span>
        <div className="flex gap-2">
          <Button icon={PenIcon} variant="outline">
            {t('actions.edit_profile')}
          </Button>
          <Button
            icon={LogOutIcon}
            variant="outline"
            onClick={() => {
              setIsLoggedIn(false)
              navigate({ to: "/" })
            }}
          >
            {t('actions.sign_out')}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <InfoCard
          label={t('pages.profile.stats.posts')}
          value={user._count.posts.toString()}
        />
        <InfoCard
          label={t('pages.profile.stats.comments')}
          value={user._count.replies.toString()}
        />
        <InfoCard
          label={t('pages.profile.stats.badges')}
          value={user._count.userBadges.toString()}
        />
      </div>
    </PageContent>
  )
}
