"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PostEditorProps {
  mode: "create" | "edit";
  initialData?: {
    slug: string;
    title: string;
    date: string;
    description: string;
    content: string;
    coverImage?: string;
  };
}

export default function PostEditor({ mode, initialData }: PostEditorProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(initialData?.title || "");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [coverPreview, setCoverPreview] = useState(initialData?.coverImage || "");

  const slug = initialData?.slug || "";

  // Debounced markdown preview
  useEffect(() => {
    if (!content.trim()) {
      setPreview("");
      return;
    }

    const timer = setTimeout(() => {
      setPreview(renderMarkdown(content));
    }, 300);

    return () => clearTimeout(timer);
  }, [content]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("请输入标题");
      return;
    }
    if (!content.trim()) {
      setError("请输入文章内容");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const url = isEdit
        ? `/api/posts/${initialData!.slug}`
        : "/api/posts";
      const method = isEdit ? "PUT" : "POST";

      const body: Record<string, string> = { title, date, description, content };
      if (coverImage.trim()) body.coverImage = coverImage.trim();

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存失败");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-8">
        {isEdit ? "编辑文章" : "写新文章"}
      </h1>

      <div className="space-y-5">
        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              标题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
              placeholder="输入文章标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            描述
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
              focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
            placeholder="简短的文章描述（可选）"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            封面图 URL
          </label>
          <div className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  setCoverPreview(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
                placeholder="输入封面图片 URL（留空则自动使用随机图片）"
              />
              <button
                type="button"
                onClick={() => {
                  const randomUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
                  setCoverImage(randomUrl);
                  setCoverPreview(randomUrl);
                }}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                🎲 随机抓取封面
              </button>
            </div>
            {coverPreview && (
              <div className="w-20 h-15 rounded-lg overflow-hidden border border-border shrink-0 bg-muted/10">
                <img
                  src={coverPreview}
                  alt="封面预览"
                  className="w-full h-full object-cover"
                  onError={() => setCoverPreview("")}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-foreground">
              文章内容 (Markdown) <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                showPreview
                  ? "bg-accent text-white border-accent"
                  : "text-muted border-border hover:border-accent/30"
              }`}
            >
              {showPreview ? "编辑" : "预览"}
            </button>
          </div>

          {showPreview ? (
            <div
              className="w-full min-h-[400px] rounded-lg border border-border p-4 bg-background prose prose-neutral dark:prose-invert max-w-none text-sm
                prose-headings:font-semibold prose-code:bg-muted/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-[#1a1a2e] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg"
              dangerouslySetInnerHTML={{ __html: preview || "<p style='color: var(--muted)'>暂无内容</p>" }}
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow resize-y"
              placeholder="在此编写 Markdown 内容..."
            />
          )}
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium
              hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "保存中..." : isEdit ? "更新文章" : "发布文章"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-muted
              hover:text-foreground hover:border-accent/30 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): string {
  const lines = text.split("\n");
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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
