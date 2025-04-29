import { PageContent } from "@/components/PageContent";
import { Button } from "@/components/ui/Button";
import { useParams, Link } from "@tanstack/react-router";
import {
  UserPlusIcon,
  PlusIcon,
  PencilLine as PencilIcon,
  FileBadge as FileBadgeIcon,
  Check as CheckIcon,
  X as XIcon,
} from "lucide-react";
import { PostAuthor } from "../Post/PostAuthor";
import { PostCard } from "../Post/PostCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/Avatar";
import {
  useGetCommunityById,
  useJoinCommunity,
} from "@/hooks/useCommunities";
import { useGetPostsByCommunity } from "@/hooks/usePosts";
import { formatDate } from "@/lib/utils";
import { InfoCard } from "@/components/ui/InfoCard";
import { useGetBadges } from "@/hooks/useBadges";
import { useGetUser } from "@/hooks/useAuth";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Banner } from "@/components/ui/Banner";
import { AuthWrapper } from "@/components/AuthWrapper";
import { useState } from "react";

export const CommunityPage = () => {
  const [forceReloadTimestamp, setForceReloadTimestamp] = useState(0);
  const communityParams = useParams({ from: "/_left-sidebar/communities/$id" });

  const communityId = communityParams.id;

  const { isLoggedIn } = useGlobalContext();

  const { data: community, refetch: refetchCommunity } =
    useGetCommunityById(communityId);
  const { data: badges, refetch: refetchBadges } = useGetBadges();
  const { data: user, refetch: refetchUser } = useGetUser();
  const { data: posts } = useGetPostsByCommunity(communityId);
  const joinCommunityMutation = useJoinCommunity();

  const joinCommunityFails = joinCommunityMutation.data?.success === false;
  const hasRequiredBadges = community?.requiredBadges?.every((badge: any) =>
    user?.badges?.some(
      (userBadge: any) => Number(userBadge.id) === Number(badge),
    ),
  );

  const userIsMember =
    community?.members?.find((member: any) => member === user?.id) &&
    hasRequiredBadges;

  const onJoinCommunity = async () => {
    if (!isLoggedIn) return;
    await joinCommunityMutation.mutateAsync(communityId);
    refetchCommunity();
    refetchUser();
    refetchBadges();
    setForceReloadTimestamp(Date.now());
  };

  if (!community) {
    return <div>Community not found {`${communityId}`}</div>;
  }

  return (
    <PageContent>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="!size-[80px]" src={community.avatar} />
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
                    loading={joinCommunityMutation.isPending}
                    onClick={onJoinCommunity}
                  >
                    Join
                  </Button>
                </AuthWrapper>
              )}

              {userIsMember && (
                <AuthWrapper>
                  <Link to="/post/create" search={{ community: community.id }}>
                    <Button size="sm" icon={PlusIcon}>
                      New Post
                    </Button>
                  </Link>
                </AuthWrapper>
              )}
            </div>
          </div>

          <div className="flex gap-6">
            <InfoCard
              label="Members"
              value={community?.members?.length || 0}
              variant="base"
              fontSize="lg"
            />
            <InfoCard
              label="Posts"
              value={posts?.length || 0}
              variant="base"
              fontSize="lg"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {posts?.map((post: any) => (
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
  );
};
