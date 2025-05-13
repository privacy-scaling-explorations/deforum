import { useGetPostsByCommunity, useTogglePostReaction } from "@/hooks/usePosts"
import { useGetAllBadges } from "@/hooks/useBadges"
import { TimeSince } from "@/components/ui/TimeSince"
import { MessageSquareIcon } from "lucide-react"
import { PostAuthor } from "../Post/PostAuthor"
import { PostCard } from "../Post/PostCard"
import { User as UserGroupIcon } from "lucide-react"
import { Tag } from "@/components/ui/Tag"
import { EmojiButton } from "@/components/ui/EmojiButton"
import { PostReactions } from "@/components/ui/PostReactions"
import { Link } from "@tanstack/react-router"
import { AuthWrapper } from "@/components/AuthWrapper"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { useMemo } from "react"
import { SemaphoreProofMetadata } from "@/shared/schemas/post"

interface PostReaction {
  count: number
  nullifiers: string[]
}

interface PrismaPost {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string | null
  isAnon: boolean
  authorId: string
  communityId: string
  anonymousMetadata: Record<string, any> | null
  totalViews: number
  type: "PROFILE" | "COMMUNITY"
  replies: any[]
  author: {
    id: string | null
    username: string | null
    avatar: string | null
    userBadges: Array<{
      badge: {
        id: string
        name: string
      }
    }>
  }
  community: {
    id: string
    name: string
    avatar: string | null
    slug: string
  }
  _count: {
    replies: number
  }
  reactions: Record<string, PostReaction>
}

export const PostItems = ({ communityId }: { communityId?: string }) => {
  const { data: postsData, refetch: refetchPosts } = useGetPostsByCommunity(communityId || "")
  const { data: badges } = useGetAllBadges()
  const { isLoggedIn, user } = useGlobalContext()
  const togglePostReaction = useTogglePostReaction()

  const posts = useMemo(() =>
    (postsData?.items || []) as unknown as PrismaPost[],
    [postsData]
  )

  const onToggleReaction = async (postId: string, proofMetadata: SemaphoreProofMetadata, emoji: string) => {
    if (!user) return
    await togglePostReaction.mutateAsync({
      postId,
      emoji,
      proofMetadata,
      add: true
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
    return <div>No posts found</div>
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
                    <UserGroupIcon className="size-[14px] text-purple" />
                    <Link to="/communities/$slug" params={{ slug: post.community.slug }}>
                      <span className="text-purple font-inter font-semibold text-sm">
                        {post.community.name}
                      </span>
                    </Link>
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
              <div className="flex items-center gap-2">
                <Tag tooltip="Comments">
                  <MessageSquareIcon className="size-4" />
                  <span>{post._count.replies}</span>
                </Tag>
                <PostReactions
                  size="md"
                  reactions={post.reactions ?? {}}
                  onToggleReaction={async (emoji) => {
                    await onToggleReaction(post.id, proof, emoji)
                  }}
                />
                <AuthWrapper>
                  <EmojiButton
                    size="md"
                    onClick={async (emoji) => {
                      await onToggleReaction(post.id, proof, emoji)
                    }}
                  />
                </AuthWrapper>
              </div>
            </PostCard>
          </div>
        )
      })}
    </div>
  )
}
