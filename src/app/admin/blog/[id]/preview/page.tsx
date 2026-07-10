"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BlogArticleView from "@/components/blog/BlogArticleView";
import type { BlogArticleData } from "@/components/blog/BlogArticleView";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Edit3, ExternalLink } from "lucide-react";

export default function BlogPreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [article, setArticle] = useState<BlogArticleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("blog_articles")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setArticle({
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category,
          categoryLabel: data.category_label,
          author: data.author,
          authorRole: data.author_role,
          date: data.date,
          readingTime: data.reading_time,
          image: data.image || undefined,
          relatedSlugs: data.related_slugs || [],
        });
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Artigo não encontrado</h1>
          <Link href="/admin/blog" className="text-sm text-primary hover:underline">
            Voltar à listagem
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Preview header bar */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/blog/${id}`}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowLeft size={16} />
              Voltar ao editor
            </Link>
            <span className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Pré-visualização
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              {article.title}
            </span>
            <Link
              href={`/admin/blog/${id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Edit3 size={14} />
              <span className="hidden sm:inline">Editar</span>
            </Link>
            <Link
              href={`/blog/${article.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Ver no site</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Article render — faithful preview using the shared component */}
      <BlogArticleView article={article} isPreview />
    </div>
  );
}
