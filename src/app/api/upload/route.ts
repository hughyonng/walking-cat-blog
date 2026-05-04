import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "octokit";
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

    // Read file as base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = buffer.toString("base64");

    const octokit = new Octokit({ auth: githubToken });
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: IMG_OWNER,
      repo: IMG_REPO,
      path: `${IMG_PATH}/${filename}`,
      message: `Upload image: ${filename}`,
      content,
      branch: IMG_BRANCH,
    });

    const url = `https://raw.githubusercontent.com/${IMG_OWNER}/${IMG_REPO}/${IMG_BRANCH}/${IMG_PATH}/${filename}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload Error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
