import express from 'express';
import { supabase } from '../../lib/supabase';

// Define types for request parameters and bodies
interface TodoParams {
  id: string;
}

interface TodoBody {
  title?: string;
  completed?: boolean;
}

// Create a router
const router = express.Router();

// Get all todos
router.get('/todos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Get a single todo
router.get('/todos/:id', async (req, res) => {
  const { id } = req.params as TodoParams;
  
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching todo ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// Create a new todo
router.post('/todos', async (req, res) => {
  const { title } = req.body as TodoBody;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('todos')
      .insert([{ title }])
      .select();
    
    if (error) throw error;
    
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating todo:', error);
    return res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update a todo
router.patch('/todos/:id', async (req, res) => {
  const { id } = req.params as TodoParams;
  const { title, completed } = req.body as TodoBody;
  
  try {
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error(`Error updating todo ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete a todo
router.delete('/todos/:id', async (req, res) => {
  const { id } = req.params as TodoParams;
  
  try {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return res.status(204).send();
  } catch (error) {
    console.error(`Error deleting todo ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router; 