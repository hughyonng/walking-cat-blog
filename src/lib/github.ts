import { Octokit } from "octokit";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "hughyonng";
const GITHUB_REPO = process.env.GITHUB_REPO || "walking-cat-blog";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "production";

export const isGitHubMode = !!GITHUB_TOKEN;

let _octokit: Octokit | null = null;

function getClient(): Octokit {
  if (!_octokit) {
    _octokit = new Octokit({ auth: GITHUB_TOKEN });
  }
  return _octokit;
}

interface GitHubFile {
  content: string;
  sha: string;
}

/**
 * Get file content and SHA from the GitHub repository.
 */
export async function getFile(path: string): Promise<GitHubFile | null> {
  try {
    const octokit = getClient();
    const res = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path,
      ref: GITHUB_BRANCH,
    });

    const data = res.data;
    if (Array.isArray(data) || data.type !== "file") return null;

    return {
      content: Buffer.from(data.content, "base64").toString("utf-8"),
      sha: data.sha,
    };
  } catch (err: unknown) {
    if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Create or update a file in the GitHub repository.
 * If `sha` is provided, it updates an existing file; otherwise creates a new one.
 */
export async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const octokit = getClient();
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path,
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch: GITHUB_BRANCH,
    sha,
  });
}

/**
 * Delete a file from the GitHub repository.
 */
export async function deleteFile(
  path: string,
  sha: string,
  message: string
): Promise<void> {
  const octokit = getClient();
  await octokit.rest.repos.deleteFile({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path,
    message,
    sha,
    branch: GITHUB_BRANCH,
  });
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
  try {
    const octokit = getClient();
    const res = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path,
      ref: GITHUB_BRANCH,
    });

    const data = res.data;
    if (!Array.isArray(data)) return [];

    return data.map((item: { name: string; type: string; path: string }) => ({
      name: item.name,
      type: item.type as "file" | "dir",
      path: item.path,
    }));
  } catch (err: unknown) {
    if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) {
      return [];
    }
    throw err;
  }
}
