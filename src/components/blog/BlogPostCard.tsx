"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import type { PostMeta } from "@/lib/posts";

interface BlogPostCardProps {
  post: PostMeta;
  index?: number;
}

export default function BlogPostCard({ post, index = 0 }: BlogPostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link href={`/posts/${post.slug}`} className="group block">
        <article className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-xl transition-shadow duration-300 relative group-hover:z-20">
          {/* Cover Image */}
          <div className="relative aspect-[3/4] bg-muted/10 rounded-t-2xl">
            <img
              src={post.coverImage || `https://picsum.photos/seed/${post.slug}/800/600`}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-150"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <span className="text-xs font-medium text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                阅读文章 →
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h2 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors leading-snug line-clamp-2">
              {post.title}
            </h2>
            {post.description && (
              <p className="mt-1.5 text-sm text-muted leading-relaxed line-clamp-2">
                {post.description}
              </p>
            )}
            <time className="inline-block mt-3 text-xs text-muted/60">
              {formatDate(post.date)}
            </time>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
