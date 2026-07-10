import type { Metadata } from "next";
import { blogArticles } from "@/data/blog";
import { createClient } from "@/lib/supabase/server";
import BlogArticleContent from "./BlogArticleContent";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;

  // Try static data first
  const staticArticle = blogArticles.find((a) => a.slug === slug);
  if (staticArticle) {
    return {
      title: `${staticArticle.title} — Issencial Blog`,
      description: staticArticle.excerpt,
      openGraph: {
        title: staticArticle.title,
        description: staticArticle.excerpt,
        type: "article",
        locale: "pt_PT",
        siteName: "Issencial",
        images: [{ url: "/og-image.svg", width: 1200, height: 630, type: "image/svg+xml" }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${staticArticle.title} — Issencial Blog`,
        description: staticArticle.excerpt,
        images: ["/og-image.svg"],
      },
    };
  }

  // Try Supabase for articles created via admin
  try {
    const supabase = await createClient();
    const { data: dbArticle } = await supabase
      .from("blog_articles")
      .select("title, excerpt, meta_title, meta_description")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (dbArticle) {
      const metaTitle = dbArticle.meta_title || dbArticle.title;
      const metaDesc = dbArticle.meta_description || dbArticle.excerpt;
      return {
        title: `${metaTitle} — Issencial Blog`,
        description: metaDesc,
        openGraph: {
          title: metaTitle,
          description: metaDesc,
          type: "article",
          locale: "pt_PT",
          siteName: "Issencial",
          images: [{ url: "/og-image.svg", width: 1200, height: 630, type: "image/svg+xml" }],
        },
        twitter: {
          card: "summary_large_image",
          title: `${metaTitle} — Issencial Blog`,
          description: metaDesc,
          images: ["/og-image.svg"],
        },
      };
    }
  } catch {
    // Silently fall back to generic metadata if Supabase fetch fails
  }

  return {
    title: "Artigo não encontrado — Issencial Blog",
    description: "O artigo que procura não existe ou foi removido.",
    openGraph: {
      title: "Artigo não encontrado — Issencial Blog",
      description: "O artigo que procura não existe ou foi removido.",
      type: "website",
      locale: "pt_PT",
      siteName: "Issencial",
    },
  };
}

export default function BlogArticlePage() {
  return <BlogArticleContent />;
}
