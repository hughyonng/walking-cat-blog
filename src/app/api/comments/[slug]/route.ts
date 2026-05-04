import { NextRequest, NextResponse } from "next/server";
import { getContentFile, putContentFile } from "@/lib/github";

export const dynamic = "force-dynamic";

const COMMENTS_PATH = "comments";

interface CommentItem {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface CommentsData {
  likes: number;
  comments: CommentItem[];
}

function filePath(slug: string): string {
  return `${COMMENTS_PATH}/${slug}.json`;
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// GET /api/comments/[slug] — fetch comments for a post
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const file = await getContentFile(filePath(slug));

  if (!file) {
    return NextResponse.json({ likes: 0, comments: [] });
  }

  try {
    return NextResponse.json(JSON.parse(file.content));
  } catch {
    return NextResponse.json({ likes: 0, comments: [] });
  }
}

// POST /api/comments/[slug] — add comment or toggle like
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await request.json();
    const { type } = body;

    // Read existing data
    const file = await getContentFile(filePath(slug));
    let data: CommentsData = { likes: 0, comments: [] };
    let sha: string | undefined;

    if (file) {
      try {
        data = JSON.parse(file.content);
        sha = file.sha;
      } catch {
        // start fresh if corrupted
      }
    }

    if (type === "like") {
      data.likes += 1;
      await putContentFile(filePath(slug), JSON.stringify(data), `Like post: ${slug}`, sha);
      return NextResponse.json({ likes: data.likes });
    }

    if (type === "comment") {
      const { author, content } = body;

      if (!content?.trim()) {
        return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
      }
      if (content.length > 1000) {
        return NextResponse.json({ error: "评论内容不能超过 1000 字" }, { status: 400 });
      }

      const comment: CommentItem = {
        id: newId(),
        author: author?.trim() || "匿名用户",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      data.comments.push(comment);
      await putContentFile(filePath(slug), JSON.stringify(data), `Comment on post: ${slug}`, sha);
      return NextResponse.json(comment, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
