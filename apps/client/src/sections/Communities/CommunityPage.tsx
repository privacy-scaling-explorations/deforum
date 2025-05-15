import { PageContent } from "@/components/PageContent"
import { Button } from "@/components/ui/Button"
import { useParams, Link } from "@tanstack/react-router"
import {
  UserPlusIcon,
  PlusIcon,
  PencilLine as PencilIcon,
  FileBadge as FileBadgeIcon,
  Check as CheckIcon,
  X as XIcon,
} from "lucide-react"
import { PostAuthor } from "../Post/PostAuthor"
import { PostCard } from "../Post/PostCard"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/Avatar"
import { useGetCommunityBySlug } from "@/hooks/useCommunities"
import { useGetPostsByCommunity } from "@/hooks/usePosts"
import { InfoCard } from "@/components/ui/InfoCard"
import { useGetAllBadges } from "@/hooks/useBadges"
import { useGetUser } from "@/hooks/useAuth"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { AuthWrapper } from "@/components/AuthWrapper"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { useTranslation } from "react-i18next"

export const CommunityPage = () => {
  const [forceReloadTimestamp, setForceReloadTimestamp] = useState(0)
  const { slug } = useParams({ from: "/_left-sidebar/communities/$slug" })
  const { t } = useTranslation()

  const { isLoggedIn } = useGlobalContext()

  const { data: community, refetch: refetchCommunity } =
    useGetCommunityBySlug(slug)
  const { data: badges, refetch: refetchBadges } = useGetAllBadges()
  const { data: user } = useGetUser()
  const { data: posts } = useGetPostsByCommunity(community?.id || '')
  const joinMutation = trpc.communities.join.useMutation({
    onSuccess: () => {
      refetchCommunity()
      refetchBadges()
      setForceReloadTimestamp(Date.now())
    }
  })

  const hasRequiredBadges = community?.requiredBadges?.every((requiredBadge: any) =>
    user?.credentials?.some(
      (credential: any) =>
        requiredBadge.badgeId === credential.definition.id &&
        (!credential.expiresAt || new Date(credential.expiresAt) > new Date()) &&
        !credential.revokedAt
    ),
  )

  if (!hasRequiredBadges) {
    console.warn("User does not have required badges", {
      requiredBadges: community?.requiredBadges,
      userCredentials: user?.credentials
    })
  }

  const userIsMember = user?.communities?.some(
    (userCommunity: any) => userCommunity[0] === community?.id
  ) && hasRequiredBadges

  const onJoinCommunity = async () => {
    if (!isLoggedIn || !community) return
    await joinMutation.mutateAsync(community.id)
  }

  if (!community) {
    return <div>{t('pages.communities.not_found', { slug })}</div>
  }

  return (
    <PageContent>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="!size-[80px]" src={community.avatar ?? undefined} />
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-base-foreground">
                {community.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-base-muted-foreground font-inter font-normal text-sm">
                  {community.description}
                </span>
              </div>
            </div>
            <div className="ml-auto flex gap-2.5 align-baseline">
              {!userIsMember && (
                <AuthWrapper requireLogin={!isLoggedIn} action={onJoinCommunity}>
                  <Button
                    size="sm"
                    icon={UserPlusIcon}
                    variant="outline"
                    loading={joinMutation.isPending}
                    onClick={onJoinCommunity}
                  >
                    {t('pages.communities.actions.join')}
                  </Button>
                </AuthWrapper>
              )}

              {userIsMember && (
                <AuthWrapper>
                  <Link to="/post/create" search={{ community: community.id }}>
                    <Button size="sm" icon={PlusIcon}>
                      {t('pages.communities.actions.new_post')}
                    </Button>
                  </Link>
                </AuthWrapper>
              )}
            </div>
          </div>

          <div className="flex gap-6">
            <InfoCard
              label={t('pages.communities.stats.members')}
              value={community?.members?.length || 0}
              variant="base"
              fontSize="lg"
            />
            <InfoCard
              label={t('pages.communities.stats.posts')}
              value={posts?.items?.length || 0}
              variant="base"
              fontSize="lg"
            />
          </div>

          {community.requiredBadges && community.requiredBadges.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{t('pages.communities.required_badges')}</h2>
              <div className="flex flex-wrap gap-2">
                {community.requiredBadges.map((requiredBadge) => (
                  <Badge key={requiredBadge.id} variant="secondary">
                    {requiredBadge.badge.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {posts?.items?.map((post: any) => (
            <div key={post.id} className="flex flex-col gap-14">
              <PostCard
                className="relative"
                title={post.title}
                postId={post.id}
                withHover
              >
                <PostAuthor author={post.author} createdAt={post.createdAt} />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{community.name}</Badge>
                </div>
              </PostCard>
            </div>
          ))}
        </div>
      </div>
    </PageContent>
  )
}
