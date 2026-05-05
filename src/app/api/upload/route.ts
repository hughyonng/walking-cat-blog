import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getContentFile } from "@/lib/github";

export const dynamic = "force-dynamic";

const IMG_OWNER = process.env.GITHUB_OWNER || "hughyonng";
const IMG_REPO = process.env.IMAGE_REPO || "blog-images";
const IMG_BRANCH = "main";
const IMG_PATH = "images";

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

    // Build unique filename: avatar-{timestamp}-{random}.ext
    const ext = file.name.split(".").pop() || "png";
    const timestamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    const filename = `avatar-${timestamp}-${rand}.${ext}`;
    const filePath = `${IMG_PATH}/${filename}`;

    console.log("=== Upload Debug ===");
    console.log("Original file:", file.name);
    console.log("File size:", file.size);
    console.log("File type:", file.type);
    console.log("Target repo:", `${IMG_OWNER}/${IMG_REPO}`);
    console.log("Target path:", filePath);
    console.log("Branch:", IMG_BRANCH);
    console.log("=== End Debug ===");

    // Read file as base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = buffer.toString("base64");

    // Check if file already exists (get SHA for update)
    let existingSha: string | undefined;
    try {
      const existing = await getContentFile(filePath);
      if (existing) {
        existingSha = existing.sha;
        console.log("File exists, SHA:", existingSha);
      }
    } catch (e) {
      // 404 or other error — file doesn't exist, will create new
      console.log("File does not exist yet, creating new");
    }

    // Upload to GitHub API
    const apiUrl = `https://api.github.com/repos/${IMG_OWNER}/${IMG_REPO}/contents/${filePath}`;
    const body: Record<string, unknown> = {
      message: `Upload image: ${filename}`,
      content,
      branch: IMG_BRANCH,
    };
    if (existingSha) body.sha = existingSha;

    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "walking-cat-blog",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errJson: unknown = null;
      try { errJson = JSON.parse(errText); } catch { /* ignore */ }
      console.error("=== GitHub Upload Error ===");
      console.error("Status:", res.status);
      console.error("Response body:", errText);
      console.error("Parsed JSON:", errJson);
      console.error("=== End Error ===");
      return NextResponse.json(
        {
          error: `GitHub API ${res.status}: ${res.statusText}`,
          detail: errJson || errText,
        },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const resultUrl = `https://raw.githubusercontent.com/${IMG_OWNER}/${IMG_REPO}/${IMG_BRANCH}/${filePath}`;
    console.log("Upload success:", resultUrl);

    return NextResponse.json(
      { url: resultUrl },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("=== Upload Error ===");
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
