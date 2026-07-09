"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  File,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  bucket?: string;
  folder: string;
  maxSizeMB?: number;
  accept?: string;
  multiple?: boolean;
  onUploadComplete: (files: UploadedFile[]) => void;
  className?: string;
  buttonLabel?: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  "application/pdf": FileText,
  "image/": ImageIcon,
  default: File,
};

function getFileIcon(type: string) {
  const key = Object.keys(FILE_ICONS).find((k) => type.startsWith(k));
  return FILE_ICONS[key as keyof typeof FILE_ICONS] || FILE_ICONS.default;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  bucket = "process-documents",
  folder,
  maxSizeMB = 10,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.zip",
  multiple = false,
  onUploadComplete,
  className = "",
  buttonLabel = "Upload Ficheiro",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const onUploadRef = useRef(onUploadComplete);
  onUploadRef.current = onUploadComplete;
  const supabase = createClient();

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setError(null);
      setUploading(true);
      const uploadedFiles: UploadedFile[] = [];

      for (const file of Array.from(files)) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(
            `Ficheiro "${file.name}" excede o limite de ${maxSizeMB}MB.`,
          );
          continue;
        }

        const filePath = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          setError(`Erro ao enviar "${file.name}": ${uploadError.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        uploadedFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
        });
      }

      if (uploadedFiles.length > 0) {
        setUploaded((prev) => [...prev, ...uploadedFiles]);
        onUploadRef.current(uploadedFiles);
      }

      setUploading(false);
      // Reset input
      if (inputRef.current) inputRef.current.value = "";
    },
    [bucket, folder, maxSizeMB],
  );

  const removeFile = (index: number) => {
    setUploaded((prev) => prev.filter((_, i) => i !== index));
  };

  const getInputProps = () => ({
    ref: inputRef,
    type: "file" as const,
    accept,
    multiple,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      handleUpload(e.target.files),
    className: "hidden",
  });

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounterRef.current += 1;
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounterRef.current -= 1;
          if (dragCounterRef.current === 0) {
            setDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounterRef.current = 0;
          setDragOver(false);
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-gray-200 bg-gray-50/50 hover:border-primary/40 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-sm text-gray-500">A enviar ficheiros...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-dark">{buttonLabel}</p>
              <p className="text-xs text-gray-400 mt-1">
                Arraste ficheiros ou clique para selecionar
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                PDF, imagens, documentos — Máx. {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Uploaded files */}
      {uploaded.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploaded.map((file, i) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50/50 px-3 py-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-400">{formatSize(file.size)}</p>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
                {!uploading && (
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Re-export type
export type { UploadedFile };
