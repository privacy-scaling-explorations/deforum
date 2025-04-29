import { useGetBadges, useGetPosts, useTogglePostReaction } from "@/hooks/usePosts";
import { TimeSince } from "@/components/ui/TimeSince";
import { MessageSquareIcon } from "lucide-react";
import { PostAuthor } from "../Post/PostAuthor";
import { PostCard } from "../Post/PostCard";
import { User as UserGroupIcon } from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import { EmojiButton } from "@/components/ui/EmojiButton";
import { usersMocks } from "../../../../shared/src/mocks/users.mocks";
import { PostReactions } from "@/components/ui/PostReactions";
import { Link } from "@tanstack/react-router";
import { AuthWrapper } from "@/components/AuthWrapper";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useMemo } from "react";

interface PrismaPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isAnon: boolean;
  author: {
    id: string;
    username: string;
    avatar: string | null;
    badges: string[];
  };
  community: {
    id: string;
    name: string;
    avatar: string | null;
  };
  _count: {
    replies: number;
  };
  reactions: Record<string, { count: number; nullifiers: string[] }>;
}

export const PostItems = ({ communityId }: { communityId?: string }) => {
  const { data: postsData, refetch: refetchPosts } = useGetPosts(communityId || "");
  const { data: badges } = useGetBadges();
  const { isLoggedIn } = useGlobalContext();
  const togglePostReaction = useTogglePostReaction();

  const posts = useMemo(() => 
    postsData?.items as PrismaPost[] || [], 
    [postsData]
  );

  const onToggleReaction = async (postId: string, emoji: string) => {
    await togglePostReaction.mutateAsync({
      postId,
      emoji,
      userId: usersMocks?.[0].id.toString(),
    });
    await refetchPosts();
  };

  const getUserBadges = (post: PrismaPost) => {
    return badges?.filter((badge: any) =>
      post.author.badges.includes(badge.id),
    );
  };

  if (!posts.length) {
    return <div>No posts found</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => {
        return (
          <div key={post.id} className="flex flex-col gap-14 mx-auto w-full">
            <PostCard
              className="relative !gap-[14px]"
              header={
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-1">
                    <UserGroupIcon className="size-[14px] text-purple" />
                    <Link to={`/communities/${post.community.id}` as any}>
                      <span className="text-purple font-inter font-semibold text-sm">
                        {post.community.name}
                      </span>
                    </Link>
                  </div>
                  <TimeSince isoDateTime={post.createdAt} />
                </div>
              }
              title={post.title}
              content={post.content}
              postId={post.id}
              withHover
            >
              <PostAuthor
                author={{
                  ...post.author,
                  isAnon: post.isAnon,
                }}
                badges={getUserBadges(post)}
              />
              <div className=" flex items-center gap-2">
                <Tag size="sm">
                  <MessageSquareIcon className="size-4" />
                  <span>{post._count.replies}</span>
                </Tag>

                <AuthWrapper requireLogin={!isLoggedIn}>
                  <EmojiButton
                    disabled={!isLoggedIn}
                    size="sm"
                    onClick={async (emoji) => {
                      await onToggleReaction(post.id, emoji);
                    }}
                  />
                </AuthWrapper>

                <PostReactions
                  reactions={post.reactions}
                  onToggleReaction={async (emoji) => {
                    await onToggleReaction(post.id, emoji);
                  }}
                />
              </div>
            </PostCard>
          </div>
        );
      })}
    </div>
  );
};
