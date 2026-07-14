-- ============================================
-- Issencial — Migration 018: Blog Featured Article
-- ============================================

-- ============================================
-- 1. Add is_featured column
-- ============================================
ALTER TABLE public.blog_articles
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- 2. Partial unique index to ensure only one
--    article can be featured at a time
-- ============================================
CREATE UNIQUE INDEX idx_blog_articles_single_featured
  ON public.blog_articles ((TRUE))
  WHERE is_featured = TRUE;

-- ============================================
-- 3. Update RLS: admins can update is_featured
--    (already covered by the existing "Admins can
--    manage blog articles" policy which uses FOR ALL)
-- ============================================
