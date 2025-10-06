-- First, add columns as nullable
ALTER TABLE public.container_entries 
ADD COLUMN shipper TEXT,
ADD COLUMN container_photo_url TEXT,
ADD COLUMN commodity_photo_url TEXT;

-- Drop old columns
ALTER TABLE public.container_entries 
DROP COLUMN container_number,
DROP COLUMN commodity;