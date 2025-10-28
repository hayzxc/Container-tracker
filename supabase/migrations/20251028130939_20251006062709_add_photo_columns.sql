-- First, add columns as nullable
ALTER TABLE public.container_entries 
ADD COLUMN IF NOT EXISTS shipper TEXT,
ADD COLUMN IF NOT EXISTS container_photo_url TEXT,
ADD COLUMN IF NOT EXISTS commodity_photo_url TEXT;

-- Drop old columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'container_entries' AND column_name = 'container_number'
  ) THEN
    ALTER TABLE public.container_entries DROP COLUMN container_number;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'container_entries' AND column_name = 'commodity'
  ) THEN
    ALTER TABLE public.container_entries DROP COLUMN commodity;
  END IF;
END $$;