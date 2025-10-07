-- Create shippers table
CREATE TABLE public.shippers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shippers ENABLE ROW LEVEL SECURITY;

-- Create policies for shippers
CREATE POLICY "Users can view their own shippers"
ON public.shippers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shippers"
ON public.shippers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shippers"
ON public.shippers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shippers"
ON public.shippers
FOR DELETE
USING (auth.uid() = user_id);

-- Create containers table
CREATE TABLE public.containers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  container_photo_url TEXT,
  commodity_photo_url TEXT,
  ispm_photo_url TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;

-- Create policies for containers
CREATE POLICY "Users can view their own containers"
ON public.containers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own containers"
ON public.containers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own containers"
ON public.containers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own containers"
ON public.containers
FOR DELETE
USING (auth.uid() = user_id);

-- Migrate existing data
INSERT INTO public.shippers (user_id, name, created_at)
SELECT DISTINCT user_id, shipper, MIN(created_at)
FROM public.container_entries
WHERE shipper IS NOT NULL
GROUP BY user_id, shipper;

INSERT INTO public.containers (shipper_id, user_id, container_photo_url, commodity_photo_url, ispm_photo_url, latitude, longitude, created_at)
SELECT s.id, ce.user_id, ce.container_photo_url, ce.commodity_photo_url, ce.ispm_photo_url, ce.latitude, ce.longitude, ce.created_at
FROM public.container_entries ce
JOIN public.shippers s ON s.user_id = ce.user_id AND s.name = ce.shipper
WHERE ce.shipper IS NOT NULL;

-- Drop old table
DROP TABLE public.container_entries;