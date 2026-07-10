-- ============================================
-- Issencial — Migration 009: Blog Articles CMS
-- ============================================

-- ============================================
-- 1. Blog articles table
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'passaporte' CHECK (category IN ('passaporte', 'educacao', 'financas', 'viver-portugal', 'historias')),
  category_label TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Equipa Issencial',
  author_role TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  reading_time TEXT NOT NULL DEFAULT '',
  image TEXT DEFAULT '',
  related_slugs TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  meta_keywords TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- Admins can manage all articles
CREATE POLICY "Admins can manage blog articles"
  ON public.blog_articles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Anyone can read published articles
CREATE POLICY "Anyone can read published articles"
  ON public.blog_articles FOR SELECT
  USING (status = 'published');

-- ============================================
-- 2. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON public.blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON public.blog_articles(category);
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON public.blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_created ON public.blog_articles(created_at DESC);
