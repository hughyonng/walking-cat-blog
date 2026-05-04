"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { PostMeta } from "@/lib/posts";

interface Props {
  posts: PostMeta[];
}

export default function SearchClient({ posts }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : posts;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-8">
        搜索文章
      </h1>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入关键词搜索文章..."
        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground
          placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30
          transition-shadow text-base"
        autoFocus
      />

      <div className="mt-10 space-y-6">
        {filtered.length === 0 ? (
          <p className="text-muted text-center py-12">没有找到相关文章</p>
        ) : (
          filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="block group"
            >
              <article className="border-b border-border/50 pb-6 last:border-b-0">
                <h2 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                <p className="mt-1 text-sm text-muted leading-relaxed line-clamp-2">
                  {post.description}
                </p>
                <time className="inline-block mt-2 text-xs text-muted/60">
                  {formatDate(post.date)}
                </time>
              </article>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
