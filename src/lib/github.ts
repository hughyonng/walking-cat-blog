const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "hughyonng";
const GITHUB_REPO = process.env.GITHUB_REPO || "walking-cat-blog";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "production";

// Content repo (blog-images) — stores all .md posts, site config, and uploaded images
const CONTENT_OWNER = process.env.GITHUB_OWNER || "hughyonng";
const CONTENT_REPO = process.env.IMAGE_REPO || "blog-images";
const CONTENT_BRANCH = "main";

export const isGitHubMode = !!GITHUB_TOKEN;

const BASE_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
const CONTENT_BASE_URL = `https://api.github.com/repos/${CONTENT_OWNER}/${CONTENT_REPO}`;

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "User-Agent": "walking-cat-blog",
    Accept: "application/vnd.github.v3+json",
  };
}

export interface GitHubFile {
  content: string;
  sha: string;
}

// ── Code repo operations (walking-cat-blog) ──

/**
 * Get file content and SHA from the code repository.
 */
export async function getFile(path: string): Promise<GitHubFile | null> {
  const url = `${BASE_URL}/contents/${path}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return {
    content: Buffer.from(data.content, "base64").toString("utf-8"),
    sha: data.sha,
  };
}

/**
 * Create or update a file in the code repository.
 */
export async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${BASE_URL}/contents/${path}`, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
  }
}

/**
 * Delete a file from the code repository.
 */
export async function deleteFile(
  path: string,
  sha: string,
  message: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/contents/${path}`, {
    method: "DELETE",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
  }
}

export interface GitHubDirectoryItem {
  name: string;
  type: "file" | "dir";
  path: string;
}

/**
 * List files and directories in a given path of the code repository.
 */
export async function listDirectory(path: string): Promise<GitHubDirectoryItem[]> {
  const url = `${BASE_URL}/contents/${path}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((item: { name: string; type: string; path: string }) => ({
    name: item.name,
    type: item.type as "file" | "dir",
    path: item.path,
  }));
}

// ── Content repo operations (blog-images) ──

/**
 * Get file content and SHA from the content repository (blog-images).
 * Path is relative to repo root, e.g. "posts/hello.md" or "site-config.json".
 */
export async function getContentFile(path: string): Promise<GitHubFile | null> {
  const url = `${CONTENT_BASE_URL}/contents/${path}?ref=${CONTENT_BRANCH}`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return {
    content: Buffer.from(data.content, "base64").toString("utf-8"),
    sha: data.sha,
  };
}

/**
 * Create or update a file in the content repository (blog-images).
 */
export async function putContentFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch: CONTENT_BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${CONTENT_BASE_URL}/contents/${path}`, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
  }
}

/**
 * Delete a file from the content repository (blog-images).
 */
export async function deleteContentFile(
  path: string,
  sha: string,
  message: string
): Promise<void> {
  const res = await fetch(`${CONTENT_BASE_URL}/contents/${path}`, {
    method: "DELETE",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      sha,
      branch: CONTENT_BRANCH,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
  }
}

/**
 * List files and directories in a given path of the content repository (blog-images).
 */
export async function listContentDirectory(path: string): Promise<GitHubDirectoryItem[]> {
  const url = `${CONTENT_BASE_URL}/contents/${path}?ref=${CONTENT_BRANCH}`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((item: { name: string; type: string; path: string }) => ({
    name: item.name,
    type: item.type as "file" | "dir",
    path: item.path,
  }));
}
