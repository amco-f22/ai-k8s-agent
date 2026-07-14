CREATE TABLE IF NOT EXISTS investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users(id) in InsForge/Supabase
    cluster_name TEXT DEFAULT 'default',
    investigation_data JSONB NOT NULL,
    diagnosis JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own investigations
CREATE POLICY "Users can view their own investigations"
    ON investigations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investigations"
    ON investigations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investigations"
    ON investigations FOR DELETE
    USING (auth.uid() = user_id);

