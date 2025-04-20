import { PageContent } from "@/components/PageContent";
import { PostReplyTextarea } from "@/components/post/PostReplyTextarea";
import { EmojiButton } from "@/components/ui/EmojiButton";
import { TimeSince } from "@/components/ui/TimeSince";
import { useGlobalContext } from "@/contexts/GlobalContext";
import {
  useGetPostById,
  useGetBadges,
  useTogglePostReaction,
} from "@/hooks/usePosts";
import { cn } from "@/lib/utils";
import { Link, useLoaderData } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PostAuthor } from "./PostAuthor";
import { PostCard } from "./PostCard";
import {
  MessageSquare as MessageSquareIcon,
  Reply as ReplyIcon,
  Link as LinkIcon,
  User as UserGroupIcon,
} from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import { PostReactions } from "@/components/ui/PostReactions";
import { usersMocks } from "@/shared/mocks/users.mocks";

export const PostPage = () => {
  const { postId } = useLoaderData({ from: "/_app/posts/$postId" });
  const { user } = useGlobalContext();
  const [replyTo, setReplyTo] = useState<string | number | null>(null);
  const [mainReply, setMainReply] = useState<boolean>(false);
  const { data: postData, refetch: refetchPost } = useGetPostById(postId);
  const { data: badges } = useGetBadges();
  const togglePostReaction = useTogglePostReaction();

  const userBadges = useMemo(() => {
    return badges?.filter((badge: any) =>
      postData?.author.badges?.includes(badge.id),
    );
  }, [badges, postData]);

  const onToggleReaction = async (postId: number | string, emoji: string) => {
    await togglePostReaction.mutateAsync({
      postId: postId.toString(),
      emoji,
      userId: usersMocks?.[0].id.toString(),
    });
    await refetchPost();
  };

  console.log("badge", postData, badges);

  if (!postData) {
    return <div>Post not found</div>;
  }

  return (
    <PageContent className="flex flex-col gap-10 lg:max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-3">
        <PostCard
          title={postData?.title ?? "Post not found"}
          size="lg"
          clampTitle={false}
          header={
            <div className="flex flex-col gap-4 pb-3">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-1">
                  <UserGroupIcon className="size-[14px] text-purple" />
                  <Link to={`/communities/${postData.communityData?.id}` as any}>
                    <span className="text-purple font-inter font-semibold text-sm">
                      {postData.communityData?.name}
                    </span>
                  </Link>
                </div>
                <TimeSince isoDateTime={postData.createdAt} />
              </div>
              <PostAuthor
                author={postData.author}
                avatarClassName="!size-[30px]"
                badges={userBadges}
              />
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            <div>{postData.content}</div>
            <div className="flex items-center gap-2">
              <Tag tooltip="Comments">
                <MessageSquareIcon className="size-4" />
                <span>{postData.replies?.length ?? 0}</span>
              </Tag>
              <PostReactions
                size="md"
                reactions={postData.reactions ?? {}}
                onToggleReaction={async (emoji) => {
                  await onToggleReaction(postData.id, emoji);
                }}
              />
              <EmojiButton
                size="md"
                onClick={async (emoji) => {
                  await onToggleReaction(postData.id, emoji);
                }}
              />
            </div>
          </div>
        </PostCard>
        <PostReplyTextarea
          placeholder="Add comment"
          rows={2}
          showFields={mainReply}
          isVisible
          onFocus={() => {
            setMainReply(true);
          }}
          onBlur={() => {
            setMainReply(false);
          }}
        />
      </div>
      <div className="flex flex-col gap-6">
        {postData.replies?.map((reply: any, index: number) => {
          const hasSubReplies = reply.replies?.length > 0;

          return (
            <div className="flex flex-col gap-5" key={index}>
              <div className=" flex flex-col gap-2" key={index}>
                <PostAuthor
                  author={reply.author}
                  createdAt={reply.createdAt}
                  avatarClassName="!size-6 mr-1"
                />
                <div className="relative flex flex-col gap-6 ml-[30px]">
                  {hasSubReplies && (
                    <div className="absolute bottom-0 bg-[#E4E4E7] left-[-20px] top-0 w-[3px] h-full bg-gray-300 rounded-b-full"></div>
                  )}
                  <div className="text-base-foreground text-sm font-inter font-normal">
                    <div>{reply.content}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EmojiButton size="md" />
                    <Tag
                      tooltip="Reply"
                      onClick={() => {
                        setReplyTo(reply.id);
                      }}
                    >
                      <ReplyIcon className="size-4 text-black" />
                    </Tag>
                    <Tag tooltip="Copy link">
                      <LinkIcon className="size-4 text-black" />
                    </Tag>
                  </div>
                  <PostReplyTextarea
                    postId={postId}
                    author={reply.author}
                    isVisible={replyTo === reply.id}
                    showFields
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-10 relative">
                {reply?.replies?.map((replyChildren: any, index: number) => {
                  return (
                    <div className="flex flex-col gap-2" key={index}>
                      <PostAuthor
                        author={replyChildren.author}
                        createdAt={replyChildren.createdAt}
                        avatarClassName="!size-6 mr-1"
                      />
                      <div
                        className={cn(
                          "flex flex-col gap-6 ml-[30px]",
                          hasSubReplies ? "" : "",
                        )}
                      >
                        <div className="text-base-foreground">
                          <div>{replyChildren.content}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <EmojiButton size="md" />
                          <Tag
                            tooltip="Reply"
                            onClick={() => {
                              setReplyTo(replyChildren.id);
                            }}
                          >
                            <ReplyIcon className="size-4 text-black" />
                          </Tag>
                          <Tag tooltip="Copy link">
                            <LinkIcon className="size-4 text-black" />
                          </Tag>
                        </div>
                        <PostReplyTextarea
                          postId={postId}
                          author={replyChildren.author}
                          isVisible={replyTo === replyChildren.id}
                          showFields
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </PageContent>
  );
};
