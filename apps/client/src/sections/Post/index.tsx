import { useParams } from "@tanstack/react-router"
import { useGetPostById } from "@/hooks/usePosts"
import { PostCard } from "./PostCard"
import { PageContent } from "@/components/PageContent"
import { useTranslation } from 'react-i18next'

export const Post = () => {
  const { postId } = useParams({ from: "/post/$postId" })
  const { data: post, isLoading } = useGetPostById(postId)
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <PageContent title={t('pages.post.loading')}>
        <div className="flex justify-center items-center h-[200px]">
          {t('pages.post.loading')}...
        </div>
      </PageContent>
    )
  }

  if (!post) {
    return (
      <PageContent title={t('pages.post.not_found')}>
        <div className="flex justify-center items-center h-[200px]">
          {t('pages.post.not_found_message')}
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent title={post.title}>
      <PostCard post={post} size="lg" clampTitle={false} />
    </PageContent>
  )
}