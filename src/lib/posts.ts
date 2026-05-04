import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isGitHubMode, getFile, putFile, deleteFile, listDirectory } from "@/lib/github";

const postsDirectory = path.join(process.cwd(), "src", "posts");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  coverImage: string;
}

export interface Post extends PostMeta {
  content: string;
}

async function readPostFile(slug: string): Promise<{ data: Record<string, string>; content: string }> {
  if (isGitHubMode) {
    const file = await getFile(`src/posts/${slug}.md`);
    if (!file) throw new Error(`Post "${slug}" not found`);
    return matter(file.content);
  }
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  return matter(fileContents);
}

export async function getPostSlugs(): Promise<string[]> {
  if (isGitHubMode) {
    const items = await listDirectory("src/posts");
    return items
      .filter((item) => item.name.endsWith(".md"))
      .map((item) => item.name.replace(/\.md$/, ""));
  }
  return fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** GitHub repo path for a post file */
function repoPostPath(slug: string): string {
  return `src/posts/${slug}.md`;
}

/** Build frontmatter + content string */
function buildPostContent(
  title: string,
  date: string,
  description: string,
  content: string,
  coverImage?: string
): string {
  const frontmatter: Record<string, string> = { title, date, description };
  if (coverImage) frontmatter.coverImage = coverImage;
  return matter.stringify(content, frontmatter);
}

function getDefaultCoverImage(slug: string): string {
  return `https://picsum.photos/seed/${slug}/800/600`;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const { data, content } = await readPostFile(slug);
    return {
      slug,
      title: data.title,
      date: data.date,
      description: data.description,
      coverImage: data.coverImage || getDefaultCoverImage(slug),
      content,
    };
  } catch {
    return null;
  }
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const slugs = await getPostSlugs();
  const posts = (
    await Promise.all(
      slugs.map(async (slug) => {
        try {
          const { data } = await readPostFile(slug);
          return {
            slug,
            title: data.title,
            date: data.date,
            description: data.description,
            coverImage: data.coverImage || getDefaultCoverImage(slug),
          };
        } catch {
          return null;
        }
      })
    )
  )
    .filter((p): p is PostMeta => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function sanitizeSlug(text: string): string {
  // Short hash as fallback for pure-non-ASCII titles
  const hash = Math.abs(
    text.split("").reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)
  ).toString(36).slice(0, 8);

  const slug = text
    .toLowerCase()
    // Strip Chinese and other non-ASCII, keep a-z, 0-9, spaces, hyphens
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

  return slug || `post-${hash}`;
}

function resolvePostPath(slug: string): string {
  const resolved = path.resolve(postsDirectory, `${slug}.md`);
  if (!resolved.startsWith(path.resolve(postsDirectory))) {
    throw new Error("Invalid slug: path traversal detected");
  }
  return resolved;
}

export async function createPost(
  title: string,
  date: string,
  description: string,
  content: string,
  coverImage?: string
): Promise<{ slug: string }> {
  if (!title.trim()) throw new Error("Title is required");
  if (!content.trim()) throw new Error("Content is required");

  const slug = sanitizeSlug(title);
  const repoPath = repoPostPath(slug);
  const fileContent = buildPostContent(title, date, description, content, coverImage);

  if (isGitHubMode) {
    const existing = await getFile(repoPath);
    if (existing) throw new Error(`A post with slug "${slug}" already exists`);
    await putFile(repoPath, fileContent, `Create post: ${title}`);
    return { slug };
  }

  const filePath = resolvePostPath(slug);
  if (fs.existsSync(filePath)) {
    throw new Error(`A post with slug "${slug}" already exists`);
  }
  fs.writeFileSync(filePath, fileContent, "utf8");
  return { slug };
}

export async function updatePost(
  slug: string,
  data: { title?: string; date?: string; description?: string; content?: string; coverImage?: string }
): Promise<{ slug: string }> {
  let existing: { data: Record<string, string>; content: string };

  let existingSha: string | undefined;

  if (isGitHubMode) {
    const repoPath = repoPostPath(slug);
    const file = await getFile(repoPath);
    if (!file) throw new Error(`Post "${slug}" not found`);
    existing = matter(file.content);
    existingSha = file.sha;
  } else {
    const filePath = resolvePostPath(slug);
    const fileContents = fs.readFileSync(filePath, "utf8");
    existing = matter(fileContents);
  }

  const newTitle = data.title || existing.data.title;
  const newDate = data.date || existing.data.date;
  const newDescription = data.description || existing.data.description;
  const newCoverImage = data.coverImage !== undefined ? data.coverImage : existing.data.coverImage;
  const newContent = data.content !== undefined ? data.content : existing.content;

  const newSlug = sanitizeSlug(newTitle);
  const fileContent = buildPostContent(newTitle, newDate, newDescription, newContent, newCoverImage);

  if (isGitHubMode) {
    const repoPath = repoPostPath(slug);
    const newRepoPath = repoPostPath(newSlug);

    if (newSlug !== slug) {
      const newExisting = await getFile(newRepoPath);
      if (newExisting) throw new Error(`A post with slug "${newSlug}" already exists`);

      const oldFile = await getFile(repoPath);
      if (!oldFile) throw new Error(`Post "${slug}" not found`);

      await putFile(newRepoPath, fileContent, `Rename post: ${slug} → ${newSlug}`);
      await deleteFile(repoPath, oldFile.sha, `Delete old slug: ${slug}`);
    } else {
      await putFile(repoPath, fileContent, `Update post: ${newTitle}`, existingSha);
    }

    return { slug: newSlug };
  }

  const oldPath = resolvePostPath(slug);
  const newPath = resolvePostPath(newSlug);

  if (newSlug !== slug) {
    if (fs.existsSync(newPath)) {
      throw new Error(`A post with slug "${newSlug}" already exists`);
    }
    fs.writeFileSync(newPath, fileContent, "utf8");
    fs.unlinkSync(oldPath);
  } else {
    fs.writeFileSync(oldPath, fileContent, "utf8");
  }

  return { slug: newSlug };
}

export async function deletePost(slug: string): Promise<void> {
  if (isGitHubMode) {
    const repoPath = repoPostPath(slug);
    const file = await getFile(repoPath);
    if (!file) throw new Error(`Post "${slug}" not found`);
    await deleteFile(repoPath, file.sha, `Delete post: ${slug}`);
    return;
  }

  const filePath = resolvePostPath(slug);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post "${slug}" not found`);
  }
  fs.unlinkSync(filePath);
}
