"use client";

import { useParams } from "next/navigation";
import BlogEditor from "@/components/blog/BlogEditor";

export default function EditarArtigoPage() {
  const params = useParams();
  return <BlogEditor articleId={params.id as string} />;
}
