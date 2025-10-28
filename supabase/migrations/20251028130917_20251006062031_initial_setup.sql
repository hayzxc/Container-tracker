-- Create table for container entries
CREATE TABLE IF NOT EXISTS public.container_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  container_number TEXT NOT NULL,
  commodity TEXT NOT NULL,
  ispm_photo_url TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.container_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'container_entries' AND policyname = 'Users can view their own entries'
  ) THEN
    CREATE POLICY "Users can view their own entries" 
    ON public.container_entries 
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'container_entries' AND policyname = 'Users can create their own entries'
  ) THEN
    CREATE POLICY "Users can create their own entries" 
    ON public.container_entries 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'container_entries' AND policyname = 'Users can update their own entries'
  ) THEN
    CREATE POLICY "Users can update their own entries" 
    ON public.container_entries 
    FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'container_entries' AND policyname = 'Users can delete their own entries'
  ) THEN
    CREATE POLICY "Users can delete their own entries" 
    ON public.container_entries 
    FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create storage bucket for ISPM photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ispm-photos', 'ispm-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can view their own ISPM photos'
  ) THEN
    CREATE POLICY "Users can view their own ISPM photos" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'ispm-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload their own ISPM photos'
  ) THEN
    CREATE POLICY "Users can upload their own ISPM photos" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'ispm-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their own ISPM photos'
  ) THEN
    CREATE POLICY "Users can delete their own ISPM photos" 
    ON storage.objects 
    FOR DELETE 
    USING (bucket_id = 'ispm-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;