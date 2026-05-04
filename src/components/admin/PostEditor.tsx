"use client";

import { useState, useEffect } from "react";
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
    order?: number;
    series?: string;
  };
  source?: "draft" | "published";
}

/** 从标题中智能识别系列名（《...》） */
function detectSeriesFromTitle(title: string): string | null {
  const match = title.match(/《(.+?)》/);
  return match ? match[1].trim() : null;
}

/** 从标题中智能识别序号（一、二、三... 或 1、2、3...) */
function detectOrderFromTitle(title: string): number | null {
  const chineseNum: Record<string, number> = {
    "一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
    "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
  };

  // （1）或 (1) 阿拉伯数字
  const arabic = title.match(/[（(]\s*(\d+)\s*[）)]/);
  if (arabic) return parseInt(arabic[1], 10);

  // （三）或 (三) 中文数字
  const chineseParen = title.match(/[（(]\s*([一二三四五六七八九十])\s*[）)]/);
  if (chineseParen) return chineseNum[chineseParen[1]] ?? null;

  // 三、 或 三．格式
  const chineseComma = title.match(/([一二三四五六七八九十])[、．.]/);
  if (chineseComma) return chineseNum[chineseComma[1]] ?? null;

  return null;
}

export default function PostEditor({ mode, initialData, source }: PostEditorProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const isDraft = source === "draft";

  const [title, setTitle] = useState(initialData?.title || "");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [order, setOrder] = useState(initialData?.order ?? 0);
  const [series, setSeries] = useState(initialData?.series || "");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
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

  // ── 智能识别标题中的系列名和序号 ──
  useEffect(() => {
    if (!isEdit && title) {
      if (!series) {
        const detectedSeries = detectSeriesFromTitle(title);
        if (detectedSeries) setSeries(detectedSeries);
      }
      if (order === 0) {
        const detectedOrder = detectOrderFromTitle(title);
        if (detectedOrder !== null) setOrder(detectedOrder);
      }
    }
  }, [title]);

  const buildSaveUrl = (forStatus: "draft" | "published") => {
    if (isEdit) {
      // Query param tells the API where to read the existing content from
      const sourceParam = isDraft ? "drafts" : forStatus === "draft" ? "posts" : undefined;
      const qs = sourceParam ? `?source=${sourceParam}` : "";
      return `/api/posts/${encodeURIComponent(initialData!.slug)}${qs}`;
    }
    return "/api/posts";
  };

  const doSave = async (status: "draft" | "published") => {
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
      const url = buildSaveUrl(status);
      const method = isEdit ? "PUT" : "POST";

      const body: Record<string, string | number> = { title, date, description, content, status, order, series };
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

      // Show "云端同步中" for 2s before redirecting
      setSaving(false);
      setSyncing(true);
      await new Promise((r) => setTimeout(r, 2000));

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      setSaving(false);
      setSyncing(false);
    }
  };

  const handlePublish = () => doSave("published");
  const handleSaveDraft = () => doSave("draft");

  // ── 场景化按钮配置 ──
  const isPublishing = saving && !syncing;
  const scenarios = {
    // 新建文章
    create: {
      primary: { label: "正式发布", action: handlePublish },
      secondary: { label: "保存草稿", action: handleSaveDraft },
    },
    // 从草稿箱打开
    draft: {
      primary: { label: "正式发布（转正）", action: handlePublish },
      secondary: { label: "更新草稿", action: handleSaveDraft },
    },
    // 已发布文章
    published: {
      primary: { label: "更新文章", action: handlePublish },
      secondary: { label: "转为草稿（下线）", action: handleSaveDraft },
    },
  } as const;

  const current = !isEdit ? scenarios.create : isDraft ? scenarios.draft : scenarios.published;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isEdit ? "编辑文章" : "写新文章"}
          {isDraft && (
            <span className="ml-3 text-sm font-normal text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full">
              草稿
            </span>
          )}
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

        {/* Series + Order row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              所属系列
            </label>
            <input
              type="text"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
              placeholder="例如：EVA 解读"
            />
            <p className="mt-1 text-[11px] text-muted/50">
              同系列文章将按权重排在一起，支持从《》智能识别
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              排序权重
            </label>
            <input
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
              placeholder="0"
              title="数字越小越靠前，0 为默认值"
            />
            <p className="mt-1 text-[11px] text-muted/50">
              同系列内按此排序，支持智能识别
            </p>
          </div>
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
          {/* 主按钮 — 正式发布 / 更新文章 / 转正 */}
          <button
            type="button"
            onClick={current.primary.action}
            disabled={saving || syncing}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-medium
              bg-emerald-600 hover:bg-emerald-500
              dark:bg-emerald-500 dark:hover:bg-emerald-400
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
                云端同步中...
              </>
            ) : isPublishing ? (
              "保存中..."
            ) : (
              current.primary.label
            )}
          </button>

          {/* 次按钮 — 保存草稿 / 更新草稿 / 下线 */}
          <button
            type="button"
            onClick={current.secondary.action}
            disabled={saving || syncing}
            className="px-5 py-2.5 rounded-lg border text-sm font-medium
              border-stone-300 dark:border-stone-600
              text-stone-600 dark:text-stone-400
              hover:bg-stone-100 dark:hover:bg-stone-800/40
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {current.secondary.label}
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
