"use client";

import { useState, useEffect } from "react";

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface CommentsData {
  likes: number;
  comments: Comment[];
}

export default function CommentsArea({ slug }: { slug: string }) {
  const [data, setData] = useState<CommentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = () => {
    setLoading(true);
    fetch(`/api/comments/${slug}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError("加载评论失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadComments();
  }, [slug]);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/comments/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "like" }),
      });
      const d = await res.json();
      setData((prev) => (prev ? { ...prev, likes: d.likes } : prev));
    } catch {
      // silent
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        setError(err.error || "提交失败");
        return;
      }

      const comment = await res.json();
      setData((prev) =>
        prev ? { ...prev, comments: [...prev.comments, comment] } : prev
      );
      setContent("");
    } catch {
      setError("提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-16 pt-8 border-t border-border">
      {/* Reactions */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleLike}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border
            hover:border-accent/40 hover:bg-accent/5 transition-all text-sm active:scale-95"
        >
          <span className="text-lg">❤️</span>
          <span className="text-muted font-medium">{data?.likes ?? 0}</span>
        </button>
      </div>

      {/* Comments header */}
      <h3 className="text-lg font-semibold text-foreground mb-6">
        评论{data?.comments?.length ? ` (${data.comments.length})` : ""}
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="你的名字（可选）"
          maxLength={50}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground
            placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30
            text-sm transition-shadow"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          rows={3}
          maxLength={1000}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground
            placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30
            text-sm resize-none transition-shadow"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium
              hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? "提交中..." : "发表评论"}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <p className="text-muted text-sm text-center py-8">加载中...</p>
      ) : data?.comments.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">暂无评论，来说点什么吧</p>
      ) : (
        <div className="space-y-4">
          {data?.comments.map((comment) => (
            <div
              key={comment.id}
              className="pb-4 border-b border-border/40 last:border-b-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {comment.author}
                </span>
                <span className="text-xs text-muted/50">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
