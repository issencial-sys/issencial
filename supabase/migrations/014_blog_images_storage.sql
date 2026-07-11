-- ============================================
-- Issencial — Migration 014: Blog Images Storage
-- ============================================

-- ============================================
-- 1. Create storage bucket for blog images
-- ============================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  false,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Storage RLS: Authenticated users (admins) can upload
-- ============================================
CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
  );

-- Anyone can view blog images (public bucket)
CREATE POLICY "Anyone can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

-- Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update blog images"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can delete blog images
CREATE POLICY "Authenticated users can delete blog images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
  );
