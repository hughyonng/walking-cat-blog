import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { contentToHtml } from "@/lib/render-content";
import PostLayout from "@/components/layout/PostLayout";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const contentHtml = contentToHtml(post.content);
  const formattedDate = formatDate(post.date);

  return (
    <PostLayout title={post.title} date={formattedDate}>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </PostLayout>
  );
}
