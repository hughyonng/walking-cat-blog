import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost } from "@/lib/posts";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await getAllPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const token = await getTokenFromRequest(request);
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, date, description, content, coverImage, status } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    console.log("Starting upload...", { title, status });
    const result = await createPost(
      title,
      date || new Date().toISOString().split("T")[0],
      description || "",
      content,
      coverImage,
      status
    );
    console.log("Upload success!", result);

    if (result.isUpdate) {
      return NextResponse.json({ slug: result.slug, message: "文章已更新" }, { status: 200 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
