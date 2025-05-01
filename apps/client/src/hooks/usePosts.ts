import { useMutation, useQuery } from "@tanstack/react-query"
import { useStorage } from "./useStorage"
import { LOCAL_STORAGE_KEYS } from "@/settings"
import { CreatePostSchema, PostSchema } from "@/shared/schemas/post.schema"
import { trpc } from "../lib/trpc"

export const useGetPosts = (communityId: string) => {
  return trpc.posts.all.useQuery({ 
    communityId,
    limit: 10 
  }, {
    enabled: !!communityId
  });
}

export const useGetBadges = () => {
  return trpc.badges.list.useQuery()
}

export const useGetPostById = (postId: string | number) => {
  return trpc.posts.byId.useQuery(postId.toString())
}

export const useGetPostsByCommunity = (communityId: string | undefined) => {
  return trpc.posts.byCommunity.useQuery({ communityId: communityId! }, {
    enabled: !!communityId
  });
}

export const useTogglePostReaction = () => {
  return trpc.posts.toggleReaction.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries
      trpc.posts.all.invalidate()
    },
  })
}

export const useCreatePostMutation = () => {
  return trpc.posts.create.useMutation({
    onSuccess: () => {
      // Invalidate the posts list query
      trpc.posts.all.invalidate()
    },
  })
}

interface PostDraft {
  id: string
  title?: string
  content?: string
  communityId?: string
  createdAt: number
}

export const useCreateDraftMutation = () => {
  const { getItem, setItem } = useStorage<PostDraft[]>(
    LOCAL_STORAGE_KEYS.POST_DRAFT,
  )

  return useMutation({
    mutationFn: (draft: Omit<PostDraft, "id" | "createdAt">): any => {
      const drafts = getItem() || []
      const newDraft = {
        ...draft,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      }
      setItem([...drafts, newDraft])
      return newDraft
    },
  })
}

export const useGetDrafts = () => {
  const { getItem } = useStorage<PostDraft[]>(LOCAL_STORAGE_KEYS.POST_DRAFT)

  return useQuery({
    queryKey: ["post.drafts"],
    queryFn: () => {
      const drafts = getItem() || []
      return drafts
    },
  })
}

export const useRemoveDraft = () => {
  const { getItem, setItem } = useStorage<PostDraft[]>(
    LOCAL_STORAGE_KEYS.POST_DRAFT,
  )

  return useMutation({
    mutationFn: (draftId: string) => {
      const drafts = getItem() || []
      const filteredDrafts = drafts.filter((draft) => draft.id !== draftId)
      return setItem(filteredDrafts)
    },
  })
}

export const useUpdateDraft = () => {
  const { getItem, setItem } = useStorage<PostDraft[]>(
    LOCAL_STORAGE_KEYS.POST_DRAFT,
  )

  return useMutation({
    mutationFn: (updatedDraft: PostDraft) => {
      const drafts = getItem() || []
      const updatedDrafts = drafts.map((draft) =>
        draft.id === updatedDraft.id ? updatedDraft : draft,
      )
      return setItem(updatedDrafts)
    },
  })
}
