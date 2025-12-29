-- Run this ONLY if you already have the old database schema
-- This adds the images column to existing projects table

-- Add images column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'images'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN images JSONB DEFAULT '[]';
  END IF;
END $$;

-- Update existing projects to have default images array based on image_url
UPDATE public.projects 
SET images = CASE 
  WHEN image_url IS NOT NULL AND image_url != '' 
  THEN json_build_array(json_build_object('url', image_url, 'color', '#ffffff', 'name', 'Default'))::jsonb
  ELSE '[]'::jsonb
END
WHERE images IS NULL OR images = '[]'::jsonb;

SELECT 'Images column added/updated!' as status;
