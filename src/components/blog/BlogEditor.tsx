"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  ExternalLink,
  X,
  Loader2,
  Plus,
  ChevronDown,
  FileText,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BlogArticleView from "@/components/blog/BlogArticleView";

const categories = [
  { value: "passaporte", label: "Passaporte & Vistos" },
  { value: "educacao", label: "Educação" },
  { value: "financas", label: "Finanças" },
  { value: "viver-portugal", label: "Viver em Portugal" },
  { value: "historias", label: "Histórias de Clientes" },
];

interface FormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  category_label: string;
  author: string;
  author_role: string;
  date: string;
  reading_time: string;
  image: string;
  status: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  related_slugs: string[];
}

const emptyForm: FormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "passaporte",
  category_label: "Passaporte & Vistos",
  author: "Equipa Issencial",
  author_role: "Especialista",
  date: new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, ""),
  reading_time: "5 min de leitura",
  image: "",
  status: "draft",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  related_slugs: [],
};

export default function BlogEditor({ articleId }: { articleId?: string }) {
  const isEditing = !!articleId;
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [newRelated, setNewRelated] = useState("");
  const [allArticles, setAllArticles] = useState<{ slug: string; title: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (articleId) {
      loadArticle(articleId);
    }
    loadAllArticles();
  }, [articleId]);

  const loadArticle = async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_articles")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setForm({
        title: data.title || "",
        slug: data.slug || "",
        excerpt: data.excerpt || "",
        content: data.content || "",
        category: data.category || "passaporte",
        category_label: data.category_label || "",
        author: data.author || "Equipa Issencial",
        author_role: data.author_role || "",
        date: data.date || "",
        reading_time: data.reading_time || "",
        image: data.image || "",
        status: data.status || "draft",
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        meta_keywords: data.meta_keywords || "",
        related_slugs: data.related_slugs || [],
      });
    }
    setLoading(false);
  };

  const loadAllArticles = async () => {
    const { data } = await supabase
      .from("blog_articles")
      .select("slug, title")
      .neq("id", articleId || "")
      .order("title");

    if (data) setAllArticles(data);
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from title
      if (field === "title") {
        updated.slug = value
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      // Auto-set category_label
      if (field === "category") {
        const cat = categories.find((c) => c.value === value);
        updated.category_label = cat?.label || value;
      }
      return updated;
    });
  };

  const addRelated = () => {
    if (newRelated && !form.related_slugs.includes(newRelated)) {
      setForm((prev) => ({ ...prev, related_slugs: [...prev.related_slugs, newRelated] }));
      setNewRelated("");
    }
  };

  const removeRelated = (slug: string) => {
    setForm((prev) => ({
      ...prev,
      related_slugs: prev.related_slugs.filter((s) => s !== slug),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const filePath = `articles/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setError(`Erro ao enviar imagem: ${uploadError.message}`);
    } else {
      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);
      if (urlData?.publicUrl) {
        setForm((prev) => ({ ...prev, image: urlData.publicUrl }));
      }
    }

    setUploadingImage(false);
    if (e.target) e.target.value = "";
  };

  const handleImageUrlSubmit = () => {
    if (imageUrlInput.trim()) {
      setForm((prev) => ({ ...prev, image: imageUrlInput.trim() }));
      setImageUrlInput("");
      setShowImageUrlInput(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const handleSave = async (publish = false) => {
    setSaving(true);
    setError(null);

    if (!form.title || !form.slug) {
      setError("Título e slug são obrigatórios.");
      setSaving(false);
      return;
    }

    const payload = {
      slug: form.slug,
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      category: form.category,
      category_label: form.category_label || categories.find((c) => c.value === form.category)?.label || form.category,
      author: form.author,
      author_role: form.author_role,
      date: form.date,
      reading_time: form.reading_time,
      image: form.image || null,
      status: publish ? "published" : form.status,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      meta_keywords: form.meta_keywords || null,
      related_slugs: form.related_slugs,
      updated_at: new Date().toISOString(),
    };

    if (isEditing) {
      const { error: err } = await supabase
        .from("blog_articles")
        .update(payload)
        .eq("id", articleId);

      if (err) {
        setError(err.message);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } else {
      const { data, error: err } = await supabase
        .from("blog_articles")
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select("id")
        .single();

      if (err) {
        setError(err.message);
      } else if (data) {
        router.push(`/admin/blog/${data.id}`);
      }
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const previewArticle = {
    slug: form.slug || "preview",
    title: form.title || "(Sem título)",
    excerpt: form.excerpt || "",
    content: form.content || "*Conteúdo vazio*",
    category: form.category,
    categoryLabel: form.category_label || categories.find((c) => c.value === form.category)?.label || form.category,
    author: form.author || "Equipa Issencial",
    authorRole: form.author_role || "",
    date: form.date || new Date().toLocaleDateString("pt-PT"),
    readingTime: form.reading_time || "",
    image: form.image || undefined,
    relatedSlugs: form.related_slugs,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Editar Artigo" : "Novo Artigo"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? "Edite os campos abaixo." : "Preencha os campos para criar um novo artigo."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Eye size={16} />
            Pré-visualizar
          </button>
          {isEditing && (
            <Link
              href={`/admin/blog/${articleId}/preview`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              <ExternalLink size={16} />
              Preview Nova Janela
            </Link>
          )}
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-gray-950 hover:bg-accent-light transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditing ? "Publicar" : "Criar & Publicar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Artigo guardado com sucesso!
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Informação Básica</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Título do artigo"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  placeholder="slug-do-artigo"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">URL: /blog/{form.slug || "slug-do-artigo"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerto</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => handleChange("excerpt", e.target.value)}
                  placeholder="Breve descrição do artigo (aparece na listagem)"
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Conteúdo (Markdown)</h2>
            <textarea
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Escreva o conteúdo do artigo em Markdown..."
              rows={20}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 font-mono resize-y"
            />
          </div>

          {/* Author */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Autor</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => handleChange("author", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input
                  type="text"
                  value={form.author_role}
                  onChange={(e) => handleChange("author_role", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
          </div>

          {/* Meta / Date */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Meta</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="text"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  placeholder="12 Jun 2026"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de leitura</label>
                <input
                  type="text"
                  value={form.reading_time}
                  onChange={(e) => handleChange("reading_time", e.target.value)}
                  placeholder="5 min de leitura"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
          </div>

          {/* Related articles */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Artigos Relacionados</h2>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  list="related-articles"
                  type="text"
                  value={newRelated}
                  onChange={(e) => setNewRelated(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRelated())}
                  placeholder="Adicionar slug de artigo relacionado..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                />
                <datalist id="related-articles">
                  {allArticles.map((a) => (
                    <option key={a.slug} value={a.slug} label={a.title} />
                  ))}
                </datalist>
              </div>
              <button
                onClick={addRelated}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-gray-600 hover:bg-gray-50 transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
            {form.related_slugs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.related_slugs.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600"
                  >
                    {slug}
                    <button onClick={() => removeRelated(slug)} className="text-gray-400 hover:text-red-500">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save buttons */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ações</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar Rascunho
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isEditing ? "Publicar Agora" : "Criar & Publicar"}
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Eye size={16} />
                Pré-visualizar Artigo
              </button>
              {isEditing && (
                <Link
                  href={`/admin/blog/${articleId}/preview`}
                  target="_blank"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Abrir Preview (nova janela)
                </Link>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Imagem do Artigo
            </h3>

            {form.image ? (
              <div className="relative rounded-xl overflow-hidden bg-gray-50 mb-3 group">
                <img
                  src={form.image}
                  alt="Preview"
                  className="w-full h-36 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                    (e.target as HTMLImageElement).className = "w-full h-36 object-contain p-4";
                  }}
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                  title="Remover imagem"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="mb-3 rounded-xl border-2 border-dashed border-gray-200 p-4 text-center">
                <ImageIcon size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-[11px] text-gray-400 mb-2">
                  Adicione uma foto para o card do artigo
                </p>
              </div>
            )}

            <div className="space-y-2">
              {/* File upload */}
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-all">
                <Upload size={14} className="text-gray-400" />
                <span className="text-xs text-gray-600 flex-1">
                  {uploadingImage ? "A enviar..." : "Upload do computador"}
                </span>
                {uploadingImage && <Loader2 size={14} className="animate-spin text-primary" />}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              {/* URL input toggle */}
              <button
                onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                className="flex items-center gap-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50 transition-all"
              >
                <LinkIcon size={14} className="text-gray-400" />
                Inserir URL
              </button>

              {showImageUrlInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleImageUrlSubmit())}
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleImageUrlSubmit}
                    disabled={!imageUrlInput.trim()}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <button
              onClick={() => setShowSeo(!showSeo)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SEO</h3>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showSeo ? "rotate-180" : ""}`} />
            </button>
            {showSeo && (
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={form.meta_title}
                    onChange={(e) => handleChange("meta_title", e.target.value)}
                    placeholder={form.title?.slice(0, 60)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">{form.meta_title.length || form.title.length}/60 caracteres</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                  <textarea
                    value={form.meta_description}
                    onChange={(e) => handleChange("meta_description", e.target.value)}
                    placeholder={form.excerpt?.slice(0, 160)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">{form.meta_description.length || form.excerpt.length}/160 caracteres</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Keywords</label>
                  <input
                    type="text"
                    value={form.meta_keywords}
                    onChange={(e) => handleChange("meta_keywords", e.target.value)}
                    placeholder="passaporte, renovação, documentos"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Slug preview */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Link do Artigo</h3>
            <p className="text-sm text-gray-600 font-mono break-all">
              /blog/{form.slug || "slug-do-artigo"}
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          {/* Preview header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Pré-visualização — {form.title || "(Sem título)"}</span>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              <X size={16} />
              Fechar Preview
            </button>
          </div>

          {/* Preview content — rendered with the faithful BlogArticleView */}
          <BlogArticleView article={previewArticle} isPreview />
        </div>
      )}
    </div>
  );
}
