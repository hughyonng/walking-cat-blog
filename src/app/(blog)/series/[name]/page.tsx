import { getAllPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const seriesName = decodeURIComponent(name);

  const allPosts = await getAllPosts();
  const seriesPosts = allPosts
    .filter((p) => p.series === seriesName)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (seriesPosts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted hover:text-accent transition-colors group mb-10"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="mr-1.5 transition-transform group-hover:-translate-x-0.5"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        返回文章列表
      </Link>

      {/* Series header */}
      <header className="mb-12">
        <span className="inline-block text-xs font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-full mb-3">
          系列
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
          {seriesName}
        </h1>
        <p className="mt-2 text-sm text-muted">共 {seriesPosts.length} 篇文章</p>
      </header>

      {/* Article list */}
      <div className="space-y-6">
        {seriesPosts.map((post, i) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="block group"
          >
            <article className="flex items-start gap-4 sm:gap-6 p-4 sm:p-5 rounded-xl border border-border/50 hover:border-accent/20 hover:bg-muted/5 transition-all">
              {/* Order number */}
              <span className="hidden sm:flex w-10 h-10 shrink-0 items-center justify-center rounded-lg bg-muted/10 text-sm font-bold text-muted group-hover:text-accent transition-colors">
                {post.order || i + 1}
              </span>

              {/* Thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-muted/10">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h2>
                <p className="mt-1 text-sm text-muted leading-relaxed line-clamp-2">
                  {post.description}
                </p>
                <time className="inline-block mt-2 text-xs text-muted/60">
                  {formatDate(post.date)}
                </time>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
