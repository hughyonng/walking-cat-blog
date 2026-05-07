import { remark } from "remark";
import html from "remark-html";

/**
 * Detect whether a string is HTML (starts with an HTML tag).
 */
export function isHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  return /^<[a-z][\s\S]*>/i.test(trimmed);
}

/**
 * Render post content to HTML, supporting both HTML and legacy markdown.
 */
export function contentToHtml(content: string): string {
  if (isHtmlContent(content)) {
    return content;
  }
  const result = remark().use(html).processSync(content);
  return result.toString();
}
