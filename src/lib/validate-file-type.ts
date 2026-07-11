/**
 * Validate file type by checking magic bytes (file signatures), not just
 * the extension or `file.type` (which can be spoofed by an attacker).
 *
 * Each entry maps an extension to one or more magic byte sequences that
 * the first bytes of the file must match exactly.
 */

type MagicEntry = {
  /** Human-readable label for error messages */
  label: string;
  /** One or more magic byte signatures (OR — any match passes) */
  signatures: Uint8Array[];
};

const MAGIC_DB: Record<string, MagicEntry> = {
  pdf: {
    label: "PDF",
    signatures: [new Uint8Array([0x25, 0x50, 0x44, 0x46])], // %PDF
  },
  jpg: {
    label: "JPEG",
    signatures: [new Uint8Array([0xff, 0xd8, 0xff])],
  },
  jpeg: {
    label: "JPEG",
    signatures: [new Uint8Array([0xff, 0xd8, 0xff])],
  },
  png: {
    label: "PNG",
    signatures: [
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
  },
  webp: {
    label: "WebP",
    signatures: [
      // RIFF .... WEBP
      new Uint8Array([0x52, 0x49, 0x46, 0x46]), // "RIFF"
      // We check bytes 8-11 separately below
    ],
  },
  zip: {
    label: "ZIP",
    signatures: [new Uint8Array([0x50, 0x4b, 0x03, 0x04])],
  },
  // OLE2 signature for old-format Office docs (Word 97-2003, Excel 97-2003)
  // ZIP signature for modern Office Open XML (.docx, .xlsx)
  doc: {
    label: "Word (DOC)",
    signatures: [
      new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), // OLE2
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // ZIP (.docx-compatible)
    ],
  },
  docx: {
    label: "Word (DOCX)",
    signatures: [new Uint8Array([0x50, 0x4b, 0x03, 0x04])], // ZIP-based
  },
  xls: {
    label: "Excel (XLS)",
    signatures: [
      new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), // OLE2
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // ZIP (.xlsx-compatible)
    ],
  },
  xlsx: {
    label: "Excel (XLSX)",
    signatures: [new Uint8Array([0x50, 0x4b, 0x03, 0x04])], // ZIP-based
  },
  txt: {
    label: "Texto (TXT)",
    // Text files have no universal magic bytes — skip signature check via empty array
    signatures: [],
  },
};

/** Number of bytes needed for the longest signature we check */
const MAX_HEADER_BYTES = 12;

/**
 * Read the first N bytes of a File as a Uint8Array.
 */
function readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer));
    };
    reader.onerror = () => reject(new Error("Erro ao ler ficheiro."));
    reader.readAsArrayBuffer(file.slice(0, bytes));
  });
}

/**
 * Extract file extension from a path/name (lowercase, no dot).
 */
function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx === -1) return "";
  return name.slice(idx + 1).toLowerCase();
}

/**
 * Check if `header` starts with `signature`.
 */
function matchesSignature(header: Uint8Array, signature: Uint8Array): boolean {
  if (header.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (header[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Validate that a file's magic bytes match its extension.
 *
 * @param file - The File to validate
 * @returns `{ valid: true }` or `{ valid: false, reason: string }`
 */
export async function validateFileMagicBytes(
  file: File,
): Promise<{ valid: true } | { valid: false; reason: string }> {
  const ext = getExtension(file.name);
  const magic = MAGIC_DB[ext];

  // Unknown extension or empty signatures (e.g., .txt) — allow
  if (!magic || magic.signatures.length === 0) {
    return { valid: true };
  }

  try {
    const header = await readFileHeader(file, MAX_HEADER_BYTES);

    // Special case: WebP needs to check both RIFF at 0-3 and WEBP at 8-11
    if (ext === "webp") {
      if (
        matchesSignature(header, new Uint8Array([0x52, 0x49, 0x46, 0x46])) &&
        header.length >= 12 &&
        header[8] === 0x57 && // W
        header[9] === 0x45 && // E
        header[10] === 0x42 && // B
        header[11] === 0x50    // P
      ) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `O ficheiro "${file.name}" não é um WebP válido.`,
      };
    }

    // Standard case: check if any signature matches
    for (const signature of magic.signatures) {
      if (matchesSignature(header, signature)) {
        return { valid: true };
      }
    }

    return {
      valid: false,
      reason: `O ficheiro "${file.name}" não é um ${magic.label} válido (extensão .${ext} não corresponde ao conteúdo real).`,
    };
  } catch {
    return {
      valid: false,
      reason: `Não foi possível validar o ficheiro "${file.name}".`,
    };
  }
}

