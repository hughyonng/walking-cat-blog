import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import PostLayout from "@/components/layout/PostLayout";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

async function renderMarkdown(content: string): Promise<string> {
  // Simple markdown to HTML conversion without external deps
  const lines = content.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
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

    // Empty line
    if (line.trim() === "") {
      html.push("</p><p>");
      continue;
    }

    // Headings
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

    // Regular paragraph text
    html.push(parseInline(line));
  }

  return `<p>${html.join("")}</p>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseInline(text: string): string {
  let result = escapeHtml(text);
  // Inline code
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Links [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>'
  );
  return result;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const contentHtml = await renderMarkdown(post.content);
  const formattedDate = formatDate(post.date);

  return (
    <PostLayout title={post.title} date={formattedDate}>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </PostLayout>
  );
}
