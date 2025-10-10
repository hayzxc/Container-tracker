-- Add custom timestamp field to containers table
ALTER TABLE public.containers 
ADD COLUMN custom_timestamp timestamp with time zone;