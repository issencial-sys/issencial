"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import BlogArticleView from "@/components/blog/BlogArticleView";
import type { BlogArticleData } from "@/components/blog/BlogArticleView";
import { blogArticles as staticArticles } from "@/data/blog";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { BlogArticle } from "@/data/blog";

const categoryBadge: Record<string, string> = {
  passaporte: "bg-[#004a54]/10 text-[#004a54]",
  educacao: "bg-[#1a4a40]/10 text-[#1a4a40]",
  financas: "bg-[#3a4a20]/10 text-[#3a4a20]",
  "viver-portugal": "bg-[#2a3a45]/10 text-[#2a3a45]",
  historias: "bg-[#4a2a35]/10 text-[#4a2a35]",
};

export default function BlogArticleContent() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<BlogArticleData | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<BlogArticleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle(slug);
  }, [slug]);

  const loadArticle = async (slug: string) => {
    setLoading(true);

    // Try Supabase first, fall back to static data
    const supabase = createClient();
    const { data: dbArticle } = await supabase
      .from("blog_articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (dbArticle) {
      const mapped: BlogArticleData = {
        slug: dbArticle.slug,
        title: dbArticle.title,
        excerpt: dbArticle.excerpt,
        content: dbArticle.content,
        category: dbArticle.category,
        categoryLabel: dbArticle.category_label,
        author: dbArticle.author,
        authorRole: dbArticle.author_role,
        date: dbArticle.date,
        readingTime: dbArticle.reading_time,
        image: dbArticle.image || undefined,
        relatedSlugs: dbArticle.related_slugs || [],
      };
      setArticle(mapped);

      // Fetch related articles from Supabase
      if (dbArticle.related_slugs?.length) {
        const { data: related } = await supabase
          .from("blog_articles")
          .select("*")
          .in("slug", dbArticle.related_slugs)
          .eq("status", "published");

        if (related) {
          setRelatedArticles(
            related.map((r: any) => ({
              slug: r.slug,
              title: r.title,
              excerpt: r.excerpt,
              content: r.content,
              category: r.category,
              categoryLabel: r.category_label,
              author: r.author,
              authorRole: r.author_role,
              date: r.date,
              readingTime: r.reading_time,
            }))
          );
        }
      }
    } else {
      // Fallback to static data
      const staticArticle = staticArticles.find((a) => a.slug === slug);
      if (staticArticle) {
        setArticle({
          slug: staticArticle.slug,
          title: staticArticle.title,
          excerpt: staticArticle.excerpt,
          content: staticArticle.content,
          category: staticArticle.category,
          categoryLabel: staticArticle.categoryLabel,
          author: staticArticle.author,
          authorRole: staticArticle.authorRole,
          date: staticArticle.date,
          readingTime: staticArticle.readingTime,
          image: staticArticle.image,
          relatedSlugs: staticArticle.relatedSlugs,
        });

        // Get related from static data
        if (staticArticle.relatedSlugs?.length) {
          const related = staticArticle.relatedSlugs
            .map((s) => staticArticles.find((a) => a.slug === s))
            .filter(Boolean) as BlogArticle[];
          setRelatedArticles(
            related.map((r) => ({
              slug: r.slug,
              title: r.title,
              excerpt: r.excerpt,
              content: r.content,
              category: r.category,
              categoryLabel: r.categoryLabel,
              author: r.author,
              authorRole: r.authorRole,
              date: r.date,
              readingTime: r.readingTime,
            }))
          );
        }
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-white pt-24">
          <Loader2 size={28} className="animate-spin text-primary" />
        </main>
        <Footer />
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-white pt-24">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#002e35] mb-4">Artigo não encontrado</h1>
            <p className="text-gray-500 mb-8">O artigo que procura não existe ou foi removido.</p>
            <Button href="/blog">Ver Todos os Artigos</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <BlogArticleView article={article} />

        {/* ─── RELATED ARTICLES ─── */}
        {relatedArticles.length > 0 && (
          <section className="py-16 lg:py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#002e35] mb-2">Artigos relacionados</h2>
                <p className="text-sm text-gray-400">Continue a ler sobre este tópico.</p>
                <div className="w-10 h-[3px] bg-[#d7de6a] rounded-full mx-auto mt-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles.map((related) => {
                  const badge = categoryBadge[related.category] || categoryBadge.passaporte;
                  return (
                    <Link
                      key={related.slug}
                      href={`/blog/${related.slug}`}
                      className="group rounded-xl border border-[#ebeceb] p-5 transition-all duration-300 hover:border-[#d7de6a]/30 hover:shadow-[0_8px_24px_rgba(0,46,53,0.04)] hover:-translate-y-1"
                    >
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3 ${badge}`}>
                        {related.categoryLabel}
                      </span>
                      <h3 className="text-sm font-bold text-[#002e35] leading-snug mb-2 group-hover:text-[#004a54] transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {related.excerpt}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {related.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {related.readingTime}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ─── NEWSLETTER CTA ─── */}
        <section className="py-16 lg:py-20 bg-[#002e35] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-[300px] h-[300px] rounded-full border border-[#d7de6a]/5 -top-[100px] -right-[80px]" />
            <div className="absolute w-[200px] h-[200px] rounded-full border border-[#d7de6a]/4 bottom-[10%] left-[5%]" />
          </div>
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,#d7de6a_1px,transparent_1px)] bg-[length:40px_40px]" />

          <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Receba os melhores artigos
            </h2>
            <p className="text-sm text-white/55 max-w-md mx-auto mb-8 leading-relaxed">
              Subscreva a nossa newsletter e receba guias, dicas e histórias diretamente no seu email.
              Sem spam. Apenas conteúdo útil para a sua vida.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
                if (!emailInput?.value) return;

                // Use a local state via data attribute on the form
                const btn = form.querySelector('button') as HTMLButtonElement;
                btn.disabled = true;
                btn.textContent = 'A subscrever...';

                try {
                  const res = await fetch("/api/newsletter/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emailInput.value }),
                  });
                  const data = await res.json();

                  if (res.ok) {
                    const msg = document.createElement('div');
                    msg.className = 'mt-4 flex items-center gap-2 justify-center text-sm text-white';
                    msg.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> ' + data.message;
                    form.parentElement?.appendChild(msg);
                    emailInput.value = '';
                    btn.textContent = 'Subscrever';
                    btn.disabled = false;
                  } else {
                    btn.textContent = 'Subscrever';
                    btn.disabled = false;
                    const msg = document.createElement('div');
                    msg.className = 'mt-4 flex items-center gap-2 justify-center text-sm text-red-300';
                    msg.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> ' + (data.error || 'Erro ao subscrever.');
                    form.parentElement?.appendChild(msg);
                  }
                } catch {
                  btn.textContent = 'Subscrever';
                  btn.disabled = false;
                }
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="O seu email"
                required
                className="flex-1 px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d7de6a]/50 focus:bg-white/10 transition-all"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-lg bg-[#d7de6a] text-[#002e35] text-sm font-semibold hover:bg-[#e3e88f] transition-all whitespace-nowrap disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                Subscrever
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
