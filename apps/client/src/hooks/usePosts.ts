import { useMutation, useQuery } from '@tanstack/react-query';
import { useStorage } from './useStorage';
import { LOCAL_STORAGE_KEYS } from '@/settings';
import { trpc } from '../lib/trpc';
import { useAuthGuard } from './useAuthGuard';

export const useGetPostsByCommunity = (communityId: string) => {
  console.debug('[useGetPosts] Fetching all posts');
  return trpc.posts.all.useQuery(
    {
      communityId,
      limit: 10
    },
    {
      enabled: !!communityId
    }
  );
};

export const useGetProfilePosts = (userId: string) => {
  console.debug('[useGetProfilePosts] Fetching all profile posts');
  return trpc.posts.profilePosts.useQuery(
    {
      userId,
      limit: 10
    },
    {
      enabled: !!userId
    }
  );
};

export const useGetPostById = (id: string) => {
  console.debug('[useGetPostById] Fetching post by ID:', id);
  return trpc.posts.byId.useQuery(id);
};

// TODO! Make post reactions private by generating semaphore proofs and keeping some local state on which reaction is yours
export const useTogglePostReaction = () => {
  const { checkAuth } = useAuthGuard();
  const utils = trpc.useUtils();

  return trpc.posts.updateReactions.useMutation({
    onMutate: () => {
      if (!checkAuth()) {
        throw new Error('Authentication required');
      }
    },
    onSuccess: () => {
      utils.posts.all.invalidate();
    }
  });
};

export const useCreatePostMutation = () => {
  const { checkAuth } = useAuthGuard();
  const utils = trpc.useUtils();

  console.debug('[useCreatePost] Setting up create post mutation');
  return trpc.posts.create.useMutation({
    onMutate: () => {
      if (!checkAuth()) {
        throw new Error('Authentication required');
      }
    },
    onSuccess: () => {
      utils.posts.all.invalidate();
    }
  });
};

export const useUpdatePost = () => {
  const { checkAuth } = useAuthGuard();
  const utils = trpc.useUtils();

  console.debug('[useUpdatePost] Setting up update post mutation');
  return trpc.posts.update.useMutation({
    onMutate: () => {
      if (!checkAuth()) {
        throw new Error('Authentication required');
      }
    },
    onSuccess: () => {
      utils.posts.all.invalidate();
    }
  });
};

export const useDeletePost = () => {
  const { checkAuth } = useAuthGuard();
  const utils = trpc.useUtils();

  console.debug('[useDeletePost] Setting up delete post mutation');
  return trpc.posts.delete.useMutation({
    onMutate: () => {
      if (!checkAuth()) {
        throw new Error('Authentication required');
      }
    },
    onSuccess: () => {
      utils.posts.all.invalidate();
    }
  });
};

interface PostDraft {
  id: string;
  title?: string;
  content?: string;
  communityId?: string;
  createdAt: number;
}

export const useCreateDraftMutation = () => {
  const { getItem, setItem } = useStorage<PostDraft[]>(LOCAL_STORAGE_KEYS.POST_DRAFT);

  return useMutation({
    mutationFn: (draft: Omit<PostDraft, 'id' | 'createdAt'>): any => {
      const drafts = getItem() || [];
      const newDraft = {
        ...draft,
        id: crypto.randomUUID(),
        createdAt: Date.now()
      };
      setItem([...drafts, newDraft]);
      return newDraft;
    }
  });
};

export const useGetDrafts = () => {
  const { getItem } = useStorage<PostDraft[]>(LOCAL_STORAGE_KEYS.POST_DRAFT);

  return useQuery({
    queryKey: ['post.drafts'],
    queryFn: () => {
      const drafts = getItem() || [];
      return drafts;
    }
  });
};

export const useRemoveDraft = () => {
  const { getItem, setItem } = useStorage<PostDraft[]>(LOCAL_STORAGE_KEYS.POST_DRAFT);

  return useMutation({
    mutationFn: async (draftId: string) => {
      const drafts = getItem() || [];
      const filteredDrafts = drafts.filter((draft) => draft.id !== draftId);
      return setItem(filteredDrafts);
    }
  });
};

export const useUpdateDraft = () => {
  const { getItem, setItem } = useStorage<PostDraft[]>(LOCAL_STORAGE_KEYS.POST_DRAFT);

  return useMutation({
    mutationFn: async (updatedDraft: PostDraft) => {
      const drafts = getItem() || [];
      const updatedDrafts = drafts.map((draft) =>
        draft.id === updatedDraft.id ? updatedDraft : draft
      );
      return setItem(updatedDrafts);
    }
  });
};
