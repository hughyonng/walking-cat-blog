"use client";

import { useState, useEffect, FormEvent } from "react";

interface CommentItem {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface CommentsData {
  likes: number;
  comments: CommentItem[];
}

export default function CommentsArea({ slug }: { slug: string }) {
  const [data, setData] = useState<CommentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/comments/${slug}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ likes: 0, comments: [] }))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/comments/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "comment",
          author: author.trim() || undefined,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "提交失败");
      }

      const comment = await res.json();
      setData((prev) =>
        prev ? { ...prev, comments: [...prev.comments, comment] } : prev
      );
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike() {
    try {
      const res = await fetch(`/api/comments/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "like" }),
      });
      const d = await res.json();
      setData((prev) => (prev ? { ...prev, likes: d.likes } : prev));
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <h2 className="text-xl font-semibold mb-6">评论</h2>

      {/* Like button */}
      <button
        type="button"
        onClick={handleLike}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors mb-8"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {data?.likes ?? 0}
      </button>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-10 space-y-3">
        <input
          type="text"
          placeholder="你的名字（可选）"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          maxLength={50}
        />
        <textarea
          placeholder="写下你的评论..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y"
          maxLength={1000}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "提交中…" : "发表评论"}
        </button>
      </form>

      {/* Comment list */}
      {loading ? (
        <p className="text-sm text-muted">加载中…</p>
      ) : data?.comments.length === 0 ? (
        <p className="text-sm text-muted">还没有评论，来写第一条吧</p>
      ) : (
        <div className="space-y-5">
          {data?.comments.map((c) => (
            <div key={c.id} className="pb-4 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium">{c.author}</span>
                <span className="text-xs text-muted">
                  {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
