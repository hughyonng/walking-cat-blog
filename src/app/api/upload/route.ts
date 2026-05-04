import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const IMG_OWNER = "hughyonng";
const IMG_REPO = "blog-images";
const IMG_BRANCH = "main";
const IMG_PATH = "posts";

export async function POST(request: NextRequest) {
  const token = await getTokenFromRequest(request);
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Build filename: YYYY-MM-DD-random.ext
    const ext = file.name.split(".").pop() || "png";
    const date = new Date().toISOString().slice(0, 10);
    const rand = Math.random().toString(36).slice(2, 8);
    const filename = `${date}-${rand}.${ext}`;
    const filePath = `${IMG_PATH}/${filename}`;

    console.log("=== Upload Debug ===");
    console.log("File name:", file.name);
    console.log("File size:", file.size);
    console.log("File type:", file.type);
    console.log("Attempting upload to:", IMG_OWNER, IMG_REPO, filePath);
    console.log("Branch:", IMG_BRANCH);
    console.log("Token length:", githubToken.length);
    console.log("=== End Debug ===");

    // Read file as base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = buffer.toString("base64");

    // Use raw fetch to GitHub API (avoids Octokit routing issues)
    const url = `https://api.github.com/repos/${IMG_OWNER}/${IMG_REPO}/contents/${filePath}`;
    console.log("PUT", url);

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "walking-cat-blog",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload image: ${filename}`,
        content,
        branch: IMG_BRANCH,
      }),
    });

    console.log("GitHub API response status:", res.status);

    if (!res.ok) {
      const errBody = await res.text();
      console.error("GitHub API error body:", errBody);
      return NextResponse.json(
        { error: `GitHub API ${res.status}: ${errBody}` },
        { status: 500 }
      );
    }

    const resultUrl = `https://raw.githubusercontent.com/${IMG_OWNER}/${IMG_REPO}/${IMG_BRANCH}/${filePath}`;
    console.log("Upload success:", resultUrl);

    return NextResponse.json({ url: resultUrl });
  } catch (error) {
    console.error("=== Upload Error ===");
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
