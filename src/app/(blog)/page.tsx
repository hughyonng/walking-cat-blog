import { getAllPosts } from "@/lib/posts";
import { getSiteConfig } from "@/lib/config";
import BlogPostCard from "@/components/blog/BlogPostCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await getSiteConfig();
  const posts = await getAllPosts();

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
      {posts.length > 0 ? (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post, i) => (
            <BlogPostCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-muted text-lg">暂无文章</p>
        </div>
      )}
    </div>
  );
}
