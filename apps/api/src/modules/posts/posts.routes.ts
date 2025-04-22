import express from 'express';
import { supabase } from '../../lib/supabase';

// Define types for request parameters and bodies
interface PostParams {
  id: string;
}

interface PostBody {
  title?: string;
  content?: string;
  community_id?: string;
  is_anon?: boolean;
}

interface PostReplyParams {
  id: string;
  postId: string;
  replyId: string;
}

interface PostReplyBody {
  content?: string;
  reply_parent_id?: string;
  is_anon?: boolean;
}

// Create a router
const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:author_id(id, username, avatar), community:community_id(id, name, avatar)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get posts by community
router.get('/community/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:author_id(id, username, avatar), community:community_id(id, name, avatar)')
      .eq('community_id', id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching posts for community ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch community posts' });
  }
});

// Get posts by author
router.get('/author/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:author_id(id, username, avatar), community:community_id(id, name, avatar)')
      .eq('author_id', id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching posts for author ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch author posts' });
  }
});

// Get a single post with replies
router.get('/:id', async (req, res) => {
  const { id } = req.params as PostParams;
  
  try {
    // First get the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, author:author_id(id, username, avatar), community:community_id(id, name, avatar)')
      .eq('id', id)
      .single();
    
    if (postError) throw postError;
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Then get all top-level replies for this post
    const { data: replies, error: repliesError } = await supabase
      .from('post_replies')
      .select('*, author:author_id(id, username, avatar)')
      .eq('post_id', id)
      .is('reply_parent_id', null)
      .order('created_at', { ascending: true });
    
    if (repliesError) throw repliesError;
    
    // For each top-level reply, get its child replies
    const repliesWithChildren = await Promise.all(
      replies.map(async (reply) => {
        const { data: childReplies, error: childRepliesError } = await supabase
          .from('post_replies')
          .select('*, author:author_id(id, username, avatar)')
          .eq('reply_parent_id', reply.id)
          .order('created_at', { ascending: true });
        
        if (childRepliesError) throw childRepliesError;
        
        return {
          ...reply,
          children: childReplies || []
        };
      })
    );
    
    // Increment view count
    const { error: updateError } = await supabase
      .from('posts')
      .update({ total_views: (post.total_views || 0) + 1 })
      .eq('id', id);
    
    if (updateError) {
      console.error(`Error updating view count for post ${id}:`, updateError);
    }
    
    return res.status(200).json({
      ...post,
      replies: repliesWithChildren
    });
  } catch (error) {
    console.error(`Error fetching post ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  const { title, content, community_id, is_anon } = req.body as PostBody;
  
  // Get author_id from auth token in a real app
  // For now let's assume it's passed in the request
  const author_id = req.body.author_id;
  
  if (!title || !content || !community_id || !author_id) {
    return res.status(400).json({ error: 'Title, content, community_id, and author_id are required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ 
        title, 
        content, 
        author_id, 
        community_id, 
        is_anon: is_anon || false,
        total_views: 0,
        reactions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update a post
router.patch('/:id', async (req, res) => {
  const { id } = req.params as PostParams;
  const { title, content, is_anon } = req.body as PostBody;
  
  try {
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (is_anon !== undefined) updateData.is_anon = is_anon;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error(`Error updating post ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:id', async (req, res) => {
  const { id } = req.params as PostParams;
  
  try {
    // First delete all replies to this post
    const { error: repliesError } = await supabase
      .from('post_replies')
      .delete()
      .eq('post_id', id);
    
    if (repliesError) throw repliesError;
    
    // Then delete the post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return res.status(204).send();
  } catch (error) {
    console.error(`Error deleting post ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Add a reply to a post
router.post('/:id/replies', async (req, res) => {
  const { id } = req.params as PostParams;
  const { content, reply_parent_id, is_anon } = req.body as PostReplyBody;
  
  // Get author_id from auth token in a real app
  // For now let's assume it's passed in the request
  const author_id = req.body.author_id;
  
  if (!content || !author_id) {
    return res.status(400).json({ error: 'Content and author_id are required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('post_replies')
      .insert([{ 
        content, 
        post_id: id, 
        author_id, 
        reply_parent_id,
        is_anon: is_anon || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error(`Error creating reply for post ${id}:`, error);
    return res.status(500).json({ error: 'Failed to create reply' });
  }
});

// Update a reply
router.patch('/:id/replies/:replyId', async (req, res) => {
  const { id, replyId } = req.params as PostReplyParams;
  const { content, is_anon } = req.body as PostReplyBody;
  
  try {
    const updateData: any = {};
    
    if (content !== undefined) updateData.content = content;
    if (is_anon !== undefined) updateData.is_anon = is_anon;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('post_replies')
      .update(updateData)
      .eq('id', replyId)
      .eq('post_id', id)
      .select();
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error(`Error updating reply ${replyId} for post ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update reply' });
  }
});

// Delete a reply
router.delete('/:id/replies/:replyId', async (req, res) => {
  const { id, replyId } = req.params as PostReplyParams;
  
  try {
    // First delete any child replies
    const { error: childrenError } = await supabase
      .from('post_replies')
      .delete()
      .eq('reply_parent_id', replyId);
    
    if (childrenError) throw childrenError;
    
    // Then delete the reply
    const { error } = await supabase
      .from('post_replies')
      .delete()
      .eq('id', replyId)
      .eq('post_id', id);
    
    if (error) throw error;
    
    return res.status(204).send();
  } catch (error) {
    console.error(`Error deleting reply ${replyId} for post ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete reply' });
  }
});

// Update post reactions
router.patch('/:id/reactions', async (req, res) => {
  const { id } = req.params as PostParams;
  const { reactions } = req.body;
  
  if (!reactions) {
    return res.status(400).json({ error: 'Reactions object is required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ reactions })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error(`Error updating reactions for post ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update reactions' });
  }
});

export default router; 