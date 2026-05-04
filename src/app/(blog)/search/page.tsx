import { getAllPosts } from "@/lib/posts";
import SearchClient from "@/components/blog/SearchClient";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const posts = await getAllPosts();
  return <SearchClient posts={posts} />;
}
