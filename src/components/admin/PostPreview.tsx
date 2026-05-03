"use client";

import { useEffect, useRef } from "react";

interface PostPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  contentHtml: string;
  coverImage: string;
  date: string;
}

export default function PostPreview({
  open,
  onClose,
  title,
  description,
  contentHtml,
  coverImage,
  date,
}: PostPreviewProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const imgSrc = coverImage || `https://picsum.photos/seed/preview/800/600`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-3xl mx-4 bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">文章预览</h2>
          <button
            onClick={onClose}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ✕ 关闭
          </button>
        </div>

        {/* Card preview */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/5">
          <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">首页卡片效果</p>
          <div className="max-w-sm">
            <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm">
              <div className="relative aspect-[4/3] bg-muted/10">
                <img
                  src={imgSrc}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  {title || "（未填写标题）"}
                </h3>
                {description && (
                  <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                    {description}
                  </p>
                )}
                <time className="inline-block mt-2 text-[11px] text-muted/60">
                  {date}
                </time>
              </div>
            </div>
          </div>
        </div>

        {/* Full article preview */}
        <div className="px-6 pt-4 pb-6">
          <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">文章正文效果</p>
          <article>
            <header className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                {title || "（未填写标题）"}
              </h1>
              <time className="block mt-2 text-sm text-muted">{date}</time>
            </header>

            {contentHtml ? (
              <div
                className="
                  prose prose-neutral dark:prose-invert max-w-none
                  prose-headings:font-semibold prose-headings:tracking-tight
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
                  prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                  prose-p:leading-relaxed prose-p:text-foreground/80
                  prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                  prose-code:font-mono prose-code:text-sm prose-code:bg-muted/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-[#1a1a2e] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg prose-pre:text-sm
                  prose-blockquote:border-l-accent prose-blockquote:text-muted prose-blockquote:not-italic
                  prose-strong:font-semibold
                  prose-ul:space-y-1 prose-li:leading-relaxed
                  prose-img:rounded-lg
                  [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit
                "
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            ) : (
              <p className="text-sm text-muted/50 italic">暂无正文内容</p>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
