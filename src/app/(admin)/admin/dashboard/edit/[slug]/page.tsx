import { getPostBySlug, getDraftBySlug } from "@/lib/posts";
import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { slug: rawSlug } = await params;
  const { source } = await searchParams;
  const slug = decodeURIComponent(rawSlug);
  const isDraft = source === "draft";

  const post = isDraft ? await getDraftBySlug(slug) : await getPostBySlug(slug);

  if (!post) notFound();

  return <PostEditor mode="edit" initialData={post} source={isDraft ? "draft" : "published"} />;
}
