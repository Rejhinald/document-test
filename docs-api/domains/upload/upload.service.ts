import mammoth from "mammoth";
import { marked } from "marked";
import { sanitizeDocumentHtml } from "../../lib/sanitize";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".docx"] as const;

export type ParsedUpload = { title: string; html: string };

function extname(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function baseName(name: string, ext: string): string {
  const file = name.split(/[\\/]/).pop() ?? name;
  return ext && file.toLowerCase().endsWith(ext) ? file.slice(0, -ext.length) : file;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Plain text -> paragraphs, preserving single line breaks within a block. */
function textToHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block).split("\n").join("<br>"))
    .filter((block) => block.trim().length > 0)
    .map((block) => `<p>${block}</p>`)
    .join("");
}

export function isSupportedFilename(name: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(extname(name));
}

/** Converts an uploaded .txt/.md/.docx file into a sanitized HTML document body. */
export async function parseUploadToHtml(name: string, bytes: ArrayBuffer): Promise<ParsedUpload> {
  const ext = extname(name);
  const title = baseName(name, ext).trim() || "Imported document";

  let html: string;
  if (ext === ".txt") {
    html = textToHtml(new TextDecoder().decode(bytes));
  } else if (ext === ".md" || ext === ".markdown") {
    html = await marked.parse(new TextDecoder().decode(bytes));
  } else if (ext === ".docx") {
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
    html = result.value;
  } else {
    throw new Error("Unsupported file type");
  }

  return { title, html: sanitizeDocumentHtml(html) };
}
