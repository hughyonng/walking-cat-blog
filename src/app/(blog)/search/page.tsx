import { getAllPosts, getPostBySlug } from "@/lib/posts";
import SearchClient from "@/components/blog/SearchClient";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const metas = await getAllPosts();
  const posts = await Promise.all(
    metas.map(async (meta) => {
      const full = await getPostBySlug(meta.slug);
      return { ...meta, content: full?.content || "" };
    })
  );
  return <SearchClient posts={posts} />;
}
