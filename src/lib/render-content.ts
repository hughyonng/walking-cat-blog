/**
 * Detect whether a string is HTML (starts with an HTML tag).
 */
export function isHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  return /^<[a-z][\s\S]*>/i.test(trimmed);
}

/** Escape HTML special characters */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Parse inline markdown syntax */
function parseInline(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>'
  );
  return result;
}

/**
 * Convert markdown text to HTML.
 * Used for legacy posts that are still in markdown format.
 */
export function mdToHtml(content: string): string {
  const lines = content.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push("</code></pre>");
        inCodeBlock = false;
        codeLang = "";
      } else {
        codeLang = line.slice(3).trim();
        html.push(
          `<pre><code${codeLang ? ` class="language-${codeLang}"` : ""}>`
        );
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line) + "\n");
      continue;
    }

    if (line.trim() === "") {
      html.push("</p><p>");
      continue;
    }

    if (line.startsWith("### ")) {
      html.push(`<h3>${parseInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      html.push(`<h2>${parseInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      html.push(`<h1>${parseInline(line.slice(2))}</h1>`);
      continue;
    }

    html.push(parseInline(line));
  }

  return `<p>${html.join("")}</p>`;
}

/**
 * Render post content to HTML, supporting both HTML and legacy markdown.
 */
export function contentToHtml(content: string): string {
  if (isHtmlContent(content)) {
    return content;
  }
  return mdToHtml(content);
}
