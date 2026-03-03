// markdown.jsx - Lightweight markdown-to-HTML renderer
import { useMemo } from "react";

export function renderMarkdown(content) {
  if (!content) return "";

  // Step 1: Pull all images out into a map BEFORE any other processing.
  // Key uses characters that won't appear in markdown or HTML.
  const imgMap = {};
  let imgIdx = 0;
  let text = content.replace(/!\[([^\]]*)\]\(([\s\S]*?)\)(?=\s|$|\n)/g, (_, alt, src) => {
    const key = `IMGPH${imgIdx++}`;
    imgMap[key] = `<img src="${src}" alt="${alt}" style="max-width:100%;border-radius:6px;display:block;margin:6px 0;" />`;
    return key;
  });

  // Step 2: Standard markdown transforms
  text = text.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  text = text.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  text = text.replace(/_(.+?)_/g, "<em>$1</em>");
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  text = text.replace(/^\s*[-*+] (.+)$/gm, "<li>$1</li>");
  text = text.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  text = text.replace(/^\s*\d+\. (.+)$/gm, "<li>$1</li>");
  text = text.replace(/^---$/gm, "<hr>");

  // Step 3: Paragraph wrapping — skip lines that are already block elements OR placeholders
  text = text
    .split(/\n{2,}/)
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.match(/^<(h[1-6]|ul|ol|li|hr|img)/)) return trimmed;
      // If the paragraph IS a placeholder, don't wrap it
      if (/^IMGPH\d+$/.test(trimmed)) return trimmed;
      // If the paragraph CONTAINS a placeholder, split around it
      if (/IMGPH\d+/.test(trimmed)) {
        return trimmed
          .split(/(IMGPH\d+)/)
          .map(part => {
            if (/^IMGPH\d+$/.test(part)) return part;
            const clean = part.replace(/\n/g, "<br>").trim();
            return clean ? `<p>${clean}</p>` : "";
          })
          .join("");
      }
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  // Step 4: Restore images — replace ALL occurrences including any wrapped in tags
  Object.entries(imgMap).forEach(([key, html]) => {
    // Replace the key whether it's bare, inside a <p>, or inside other tags
    text = text.replace(new RegExp(`<p>\\s*${key}\\s*</p>`, "g"), html);
    text = text.replace(new RegExp(key, "g"), html);
  });

  return text;
}

export function MarkdownRenderer({ content, style = {} }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className="md-content"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ fontSize: "0.88rem", lineHeight: 1.6, ...style }}
    />
  );
}