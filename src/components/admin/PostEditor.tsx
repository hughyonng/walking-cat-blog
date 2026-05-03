"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PostPreview from "@/components/admin/PostPreview";

const RichEditor = dynamic(() => import("@/components/admin/RichEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-border rounded-xl bg-background overflow-hidden min-h-[200px] flex items-center justify-center">
      <span className="text-sm text-muted/50">加载编辑器中...</span>
    </div>
  ),
});

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
  const [coverPreview, setCoverPreview] = useState(initialData?.coverImage || "");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleCoverUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.title = "选择封面图片";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "上传失败");
        setCoverImage(data.url);
        setCoverPreview(data.url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "上传失败";
        setError(`封面图上传失败: ${msg}`);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("请输入文章标题");
      return;
    }
    if (!content.trim() || content === "<p></p>") {
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
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isEdit ? "编辑文章" : "写新文章"}
        </h1>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-border
            text-muted hover:text-foreground hover:border-accent/30 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M7.5 3C4.5 3 2 7.5 2 7.5S4.5 12 7.5 12 13 7.5 13 7.5 10.5 3 7.5 3z" />
            <circle cx="7.5" cy="7.5" r="2" />
          </svg>
          预览
        </button>
      </div>

      <div className="space-y-5">
        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        {/* Title + Date row */}
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
              title="日期"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
            />
          </div>
        </div>

        {/* Description */}
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

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            封面图
          </label>
          <div className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    setCoverPreview(e.target.value);
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                    focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
                  placeholder="输入封面图片 URL 或上传图片"
                />
                <button
                  type="button"
                  onClick={handleCoverUpload}
                  disabled={uploading}
                  className="shrink-0 px-4 py-2.5 rounded-lg border border-border text-sm font-medium
                    text-muted hover:text-foreground hover:border-accent/30 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "上传中..." : "上传图片"}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const randomUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
                    setCoverImage(randomUrl);
                    setCoverPreview(randomUrl);
                  }}
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  随机生成封面
                </button>
              </div>
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

        {/* Rich Text Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-foreground">
              文章内容 <span className="text-red-400">*</span>
            </label>
            <span className="text-[11px] text-muted/50">
              支持粘贴 Word 内容，自动保留格式
            </span>
          </div>
          <RichEditor
            content={content}
            onChange={setContent}
            placeholder="开始写作..."
          />
        </div>

        {/* Actions */}
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

      {/* Preview Modal */}
      <PostPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        description={description}
        contentHtml={content}
        coverImage={coverImage}
        date={date}
      />
    </div>
  );
}
