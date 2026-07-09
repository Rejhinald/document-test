import sanitizeHtml from "sanitize-html";

/**
 * Allowlist matching the TipTap StarterKit + Underline feature set the editor uses:
 * paragraphs, headings (h1-h3), bold/italic/underline/strike, ordered/unordered lists,
 * blockquote, code/pre, links, and horizontal rules. Everything else is stripped so
 * imported (docx/markdown) or edited content can't carry stored XSS.
 */
const ALLOWED_TAGS = [
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "strike",
  "h1", "h2", "h3",
  "ul", "ol", "li",
  "blockquote", "code", "pre",
  "a", "span",
];

export function sanitizeDocumentHtml(dirty: string): string {
  if (!dirty) return "";
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["class"],
      code: ["class"],
      pre: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
  });
}
