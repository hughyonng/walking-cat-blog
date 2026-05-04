const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "hughyonng";
const GITHUB_REPO = process.env.GITHUB_REPO || "walking-cat-blog";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "production";

export const isGitHubMode = !!GITHUB_TOKEN;

const BASE_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

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

/**
 * Get file content and SHA from the GitHub repository.
 * Path is used as-is (e.g. "src/posts/hello.md"), no encoding — slashes are URL path separators.
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
 * Create or update a file. If `sha` is provided, updates existing file; otherwise creates new.
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
 * Delete a file from the GitHub repository.
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
 * List files and directories in a given path.
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
