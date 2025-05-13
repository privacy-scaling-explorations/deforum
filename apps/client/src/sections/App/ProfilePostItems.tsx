import { useGetProfilePosts, useTogglePostReaction } from "@/hooks/usePosts"
import { useGetAllBadges } from "@/hooks/useBadges"
import { TimeSince } from "@/components/ui/TimeSince"
import { PostAuthor } from "../Post/PostAuthor"
import { PostCard } from "../Post/PostCard"
import { MessageSquareIcon, UserIcon } from "lucide-react"
import { Tag } from "@/components/ui/Tag"
import { PostReactions } from "@/components/ui/PostReactions"
import { Link } from "@tanstack/react-router"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

interface PostReaction {
  count: number
  nullifiers: string[]
}

interface PrismaPost {
  id: string
  title: string
  content: string
  createdAt: string
  communityId: string | null
  type: "PROFILE" | "COMMUNITY"
  replies: any[]
  author: {
    id: string
    username: string
    isAnon: boolean
    userBadges: Array<{
      badge: {
        id: string
        name: string
      }
    }>
  }
  isAnon: boolean
  _count: {
    replies: number
  }
  reactions: Array<{
    id: string
    createdAt: string
    emoji: string
    postId?: string
    proofMetadata?: {
      id: string
      createdAt: string
      proof: string
      nullifier: string
      publicSignals: string[]
      merkleRootId: string
    }
    replyId?: string
  }>
}

export const ProfilePostItems = ({ userId, username }: { userId: string; username: string }) => {
  const { data: postsData, refetch: refetchPosts } = useGetProfilePosts(userId)
  const { data: badges } = useGetAllBadges()
  const { user } = useGlobalContext()
  const togglePostReaction = useTogglePostReaction()
  const { t } = useTranslation()

  const posts = useMemo(() =>
    (postsData?.items || []) as unknown as PrismaPost[],
    [postsData]
  )

  const onToggleReaction = async (postId: string, emoji: string) => {
    if (!user) return
    await togglePostReaction.mutateAsync({
      postId,
      emoji,
      userId: user.id,
    })
    await refetchPosts()
  }

  const getUserBadges = (post: PrismaPost) => {
    if (!badges || !post.author.userBadges) return []
    return badges.filter((badge: any) =>
      post.author.userBadges.some(ub => ub.badge.id === badge.id)
    )
  }

  if (!posts.length) {
    return <div className="text-base-muted-foreground">{t("pages.profile.no_posts", "No posts yet")}</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => {
        return (
          <div key={post.id} className="flex flex-col gap-14 mx-auto w-full">
            <PostCard
              className="relative !gap-[14px]"
              post={post}
              header={
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-1">
                    <UserIcon className="size-[14px] text-purple" />
                    <span className="text-purple font-inter font-semibold text-sm">
                      {username}
                    </span>
                  </div>
                  <TimeSince isoDateTime={post.createdAt} />
                </div>
              }
              withHover
            >
              <PostAuthor
                author={{
                  ...post.author,
                  isAnon: post.isAnon,
                }}
                badges={getUserBadges(post)}
              />
              <div className="flex items-center gap-2 mt-2">
                <Tag tooltip={t("pages.profile.stats.comments")}>
                  <MessageSquareIcon className="size-4" />
                  <span>{post._count.replies}</span>
                </Tag>
                <PostReactions
                  reactions={post.reactions || []}
                  onToggleReaction={(emoji) => onToggleReaction(post.id, emoji)}
                />
              </div>
            </PostCard>
          </div>
        )
      })}
    </div>
  )
}