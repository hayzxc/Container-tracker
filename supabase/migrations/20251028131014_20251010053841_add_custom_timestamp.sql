-- Add custom timestamp field to containers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'containers' AND column_name = 'custom_timestamp'
  ) THEN
    ALTER TABLE public.containers ADD COLUMN custom_timestamp timestamp with time zone;
  END IF;
END $$;