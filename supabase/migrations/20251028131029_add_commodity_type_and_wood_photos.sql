/*
  # Add Commodity Type and Wood-Specific Photos

  1. Changes
    - Add `commodity_type` column to containers table (text field)
    - Add `stacking_photo_url` column for wood commodity stacking photo
    - Add `moisture_photo_url` column for wood commodity moisture content photo
  
  2. Notes
    - commodity_type stores the selected commodity type (e.g., "kayu", "batu bara", etc.)
    - stacking_photo_url and moisture_photo_url are only used when commodity_type is "kayu"
    - These fields are nullable to allow for non-wood commodities
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'containers' AND column_name = 'commodity_type'
  ) THEN
    ALTER TABLE public.containers ADD COLUMN commodity_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'containers' AND column_name = 'stacking_photo_url'
  ) THEN
    ALTER TABLE public.containers ADD COLUMN stacking_photo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'containers' AND column_name = 'moisture_photo_url'
  ) THEN
    ALTER TABLE public.containers ADD COLUMN moisture_photo_url text;
  END IF;
END $$;