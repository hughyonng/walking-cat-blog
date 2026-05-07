import { getAllPosts } from "@/lib/posts";
import { getSiteConfig } from "@/lib/config";
import BlogPostCard from "@/components/blog/BlogPostCard";
import SeriesCard from "@/components/blog/SeriesCard";
import type { PostMeta } from "@/lib/posts";

export const dynamic = "force-dynamic";

interface SeriesGroup {
  seriesName: string;
  posts: PostMeta[];
  coverImage: string;
  maxDate: number;
}

export default async function Home() {
  const config = await getSiteConfig();
  const posts = await getAllPosts();

  // ── 分离置顶文章 ──
  const topPosts = posts.filter((p) => p.top);
  const regular = posts.filter((p) => !p.top);

  // ── 系列聚拢 ──
  const seriesMap = new Map<string, PostMeta[]>();
  const standalonePosts: PostMeta[] = [];

  for (const post of regular) {
    if (post.series) {
      const g = seriesMap.get(post.series);
      if (g) g.push(post);
      else seriesMap.set(post.series, [post]);
    } else {
      standalonePosts.push(post);
    }
  }

  // 系列内按 order 排序
  for (const [, group] of seriesMap) {
    group.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // 构建系列封面数据
  const seriesGroups: SeriesGroup[] = [];
  for (const [name, group] of seriesMap) {
    const maxDate = Math.max(...group.map((p) => new Date(p.date).getTime()));
    seriesGroups.push({
      seriesName: name,
      posts: group,
      coverImage: group[0].coverImage,
      maxDate,
    });
  }

  // 按最新文章日期降序排列
  seriesGroups.sort((a, b) => b.maxDate - a.maxDate);
  standalonePosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8">
      {/* Hero Section */}
      <section className="mb-14">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-none">
          {config.siteTitle}
        </h1>
        <p className="mt-4 text-sm sm:text-base md:text-lg text-muted max-w-2xl leading-relaxed">
          {config.siteSubtitle}
        </p>
      </section>

      {/* Posts Grid */}
      <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* 置顶文章 */}
        {topPosts.map((post, i) => (
          <BlogPostCard key={post.slug} post={post} index={i} />
        ))}

        {/* 系列聚合 */}
        {seriesGroups.map((s, i) => (
          <SeriesCard
            key={s.seriesName}
            seriesName={s.seriesName}
            posts={s.posts}
            coverImage={s.coverImage}
            index={topPosts.length + i}
          />
        ))}

        {/* 独立文章 */}
        {standalonePosts.map((post, i) => (
          <BlogPostCard
            key={post.slug}
            post={post}
            index={topPosts.length + seriesGroups.length + i}
          />
        ))}
      </div>

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="text-center py-24">
          <p className="text-muted text-lg">暂无文章</p>
        </div>
      )}
    </div>
  );
}
