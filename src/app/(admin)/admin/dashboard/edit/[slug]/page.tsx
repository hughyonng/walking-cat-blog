import { getPostBySlug } from "@/lib/posts";
import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return <PostEditor mode="edit" initialData={post} />;
}
