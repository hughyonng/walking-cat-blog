import { getAllPosts } from "@/lib/posts";
import { formatOrdinalDay } from "@/lib/utils";
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
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8">
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
        <p className="mt-2 text-sm text-muted">共 {seriesPosts.length} 篇</p>
      </header>

      {/* Cards grid — match homepage card grid */}
      <div className="grid gap-5 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {seriesPosts.map((post, i) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group block"
          >
            <article className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-shadow duration-300">
              {/* Cover image — 4:3 aspect like homepage */}
              <div className="relative overflow-hidden aspect-[4/3] bg-muted/10">
                <img
                  src={post.coverImage}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-200"
                  loading="lazy"
                />
              </div>

              {/* Sequence number + date */}
              <div className="p-4 sm:p-5 text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
                  {post.order || i + 1}
                </div>
                <div className="mt-1.5 text-xs sm:text-sm text-muted/60 leading-none">
                  {formatOrdinalDay(post.date)}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
