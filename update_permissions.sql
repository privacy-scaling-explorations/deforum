-- Grant anon role access to todos table
GRANT ALL ON TABLE public.todos TO anon;
GRANT ALL ON SEQUENCE public.todos_id_seq TO anon;

-- Create policies for RLS
DROP POLICY IF EXISTS todo_policy ON public.todos;

-- Create a policy that allows anonymous users to select all todos
CREATE POLICY todo_select_policy ON public.todos 
    FOR SELECT 
    TO anon
    USING (true);

-- Create a policy that allows anonymous users to insert todos
CREATE POLICY todo_insert_policy ON public.todos 
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Create a policy that allows anonymous users to update todos
CREATE POLICY todo_update_policy ON public.todos 
    FOR UPDATE 
    TO anon
    USING (true);

-- Create a policy that allows anonymous users to delete todos
CREATE POLICY todo_delete_policy ON public.todos 
    FOR DELETE 
    TO anon
    USING (true); 