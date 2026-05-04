import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug, getDraftBySlug, updatePost, deletePost } from "@/lib/posts";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "posts";

  const post = source === "draft"
    ? await getDraftBySlug(slug)
    : await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const token = await getTokenFromRequest(request);
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const source = (searchParams.get("source") || "posts") as "posts" | "drafts";

  try {
    const body = await request.json();
    console.log("Starting update...", { slug, source, newStatus: body.status });
    const result = await updatePost(slug, {
      title: body.title,
      date: body.date,
      description: body.description,
      content: body.content,
      coverImage: body.coverImage,
      order: body.order ? Number(body.order) : undefined,
      status: body.status,
    }, source);
    console.log("Update success!", result);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update post";
    const status = message.includes("not found") ? 404 : message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const token = await getTokenFromRequest(request);
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const source = (searchParams.get("source") || "posts") as "posts" | "drafts";

  try {
    console.log("Starting delete...", { slug, source });
    await deletePost(slug, source);
    console.log("Delete success!", { slug, source });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete post";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
