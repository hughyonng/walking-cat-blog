import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isGitHubMode, getContentFile, putContentFile, deleteContentFile, listContentDirectory } from "@/lib/github";

const postsDirectory = path.join(process.cwd(), "src", "posts");
const draftsDirectory = path.join(process.cwd(), "src", "drafts");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  coverImage: string;
  order: number;
  series: string;
  top: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

async function readPostFile(slug: string, type: "posts" | "drafts" = "posts"): Promise<{ data: Record<string, string>; content: string }> {
  if (isGitHubMode) {
    const file = await getContentFile(`${type}/${slug}.md`);
    if (!file) throw new Error(`Post "${slug}" not found`);
    return matter(file.content);
  }
  const baseDir = type === "drafts" ? draftsDirectory : postsDirectory;
  const fullPath = path.join(baseDir, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  return matter(fileContents);
}

export async function getPostSlugs(): Promise<string[]> {
  if (isGitHubMode) {
    const items = await listContentDirectory("posts");
    return items
      .filter((item) => item.name.endsWith(".md"))
      .map((item) => item.name.replace(/\.md$/, ""));
  }
  return fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export async function getDraftSlugs(): Promise<string[]> {
  if (isGitHubMode) {
    const items = await listContentDirectory("drafts");
    return items
      .filter((item) => item.name.endsWith(".md"))
      .map((item) => item.name.replace(/\.md$/, ""));
  }
  try {
    return fs
      .readdirSync(draftsDirectory)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}

/** Content repo path for a post or draft file (blog-images/posts/ or blog-images/drafts/) */
function repoFilePath(type: "posts" | "drafts", slug: string): string {
  return `${type}/${slug}.md`;
}

/** Build frontmatter + content string */
function buildPostContent(
  title: string,
  date: string,
  description: string,
  content: string,
  coverImage?: string,
  order?: number,
  series?: string,
  top?: boolean
): string {
  const frontmatter: Record<string, string | number | boolean> = { title, date, description };
  if (coverImage) frontmatter.coverImage = coverImage;
  if (order && order > 0) frontmatter.order = order;
  if (series) frontmatter.series = series;
  if (top) frontmatter.top = top;
  return matter.stringify(content, frontmatter);
}

function getDefaultCoverImage(slug: string): string {
  return `https://picsum.photos/seed/${slug}/800/600`;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const { data, content } = await readPostFile(slug, "posts");
    return {
      slug,
      title: data.title,
      date: data.date,
      description: data.description,
      coverImage: data.coverImage || getDefaultCoverImage(slug),
      order: data.order ? Number(data.order) : 0,
      series: (data.series as string) || "",
      top: (data as any).top === true,
      content,
    };
  } catch {
    return null;
  }
}

export async function getDraftBySlug(slug: string): Promise<Post | null> {
  try {
    const { data, content } = await readPostFile(slug, "drafts");
    return {
      slug,
      title: data.title,
      date: data.date,
      description: data.description,
      coverImage: data.coverImage || getDefaultCoverImage(slug),
      order: data.order ? Number(data.order) : 0,
      series: (data.series as string) || "",
      top: (data as any).top === true,
      content,
    };
  } catch {
    return null;
  }
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const slugs = await getPostSlugs();
  const raw = (
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
            order: data.order ? Number(data.order) : 0,
            series: (data.series as string) || "",
            top: (data as any).top === true,
          };
        } catch {
          return null;
        }
      })
    )
  ).filter((p): p is PostMeta => p !== null);

  // ── 第一优先级：置顶文章 ──
  const topPosts = raw.filter(p => p.top);
  const regular = raw.filter(p => !p.top);

  // 置顶文章按时间倒序
  topPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ── 第二优先级：系列聚拢 ──
  const seriesMap = new Map<string, PostMeta[]>();
  const standalone: PostMeta[] = [];
  for (const post of regular) {
    if (post.series) {
      const g = seriesMap.get(post.series);
      if (g) g.push(post);
      else seriesMap.set(post.series, [post]);
    } else {
      standalone.push(post);
    }
  }

  interface Group { posts: PostMeta[]; maxDate: number }
  const groups: Group[] = [];

  for (const groupPosts of seriesMap.values()) {
    groupPosts.sort((a, b) => (a.order || 0) - (b.order || 0));
    const maxDate = Math.max(...groupPosts.map(p => new Date(p.date).getTime()));
    groups.push({ posts: groupPosts, maxDate });
  }

  // ── 第三兜底：无系列文章 ──
  for (const post of standalone) {
    groups.push({ posts: [post], maxDate: new Date(post.date).getTime() });
  }

  groups.sort((a, b) => b.maxDate - a.maxDate);
  return [...topPosts, ...groups.flatMap(g => g.posts)];
}

export async function getAllDrafts(): Promise<PostMeta[]> {
  const slugs = await getDraftSlugs();
  const raw = (
    await Promise.all(
      slugs.map(async (slug) => {
        try {
          const { data } = await readPostFile(slug, "drafts");
          return {
            slug,
            title: data.title,
            date: data.date,
            description: data.description,
            coverImage: data.coverImage || getDefaultCoverImage(slug),
            order: data.order ? Number(data.order) : 0,
            series: (data.series as string) || "",
            top: (data as any).top === true,
          };
        } catch {
          return null;
        }
      })
    )
  ).filter((p): p is PostMeta => p !== null);

  // 三级排序：置顶 → 系列聚拢 → 无系列按时间
  const topPosts = raw.filter(p => p.top);
  const regular = raw.filter(p => !p.top);
  topPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const seriesMap = new Map<string, PostMeta[]>();
  const standalone: PostMeta[] = [];
  for (const post of regular) {
    if (post.series) {
      const g = seriesMap.get(post.series);
      if (g) g.push(post);
      else seriesMap.set(post.series, [post]);
    } else {
      standalone.push(post);
    }
  }

  interface Group { posts: PostMeta[]; maxDate: number }
  const groups: Group[] = [];

  for (const groupPosts of seriesMap.values()) {
    groupPosts.sort((a, b) => (a.order || 0) - (b.order || 0));
    const maxDate = Math.max(...groupPosts.map(p => new Date(p.date).getTime()));
    groups.push({ posts: groupPosts, maxDate });
  }

  for (const post of standalone) {
    groups.push({ posts: [post], maxDate: new Date(post.date).getTime() });
  }

  groups.sort((a, b) => b.maxDate - a.maxDate);
  return [...topPosts, ...groups.flatMap(g => g.posts)];
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

/**
 * Generate a unique filename slug with YYYYMMDDHHmmss timestamp prefix
 * and 3-digit random suffix. Example: "20240321153045-my-post-title-583"
 * The timestamp + random guarantees uniqueness even for identical titles.
 */
function generateSlug(title: string): string {
  const now = new Date();

  const ts =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const titleSlug = sanitizeSlug(title).slice(0, 20);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${ts}-${titleSlug}-${rand}`;
}

/** Extract the 14-digit timestamp prefix from a slug, if present. */
function extractTimestamp(slug: string): string | null {
  const match = slug.match(/^(\d{14})-/);
  return match ? match[1] : null;
}

function resolvePostPath(slug: string, type: "posts" | "drafts" = "posts"): string {
  const baseDir = type === "drafts" ? draftsDirectory : postsDirectory;
  const resolved = path.resolve(baseDir, `${slug}.md`);
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error("Invalid slug: path traversal detected");
  }
  return resolved;
}

export async function createPost(
  title: string,
  date: string,
  description: string,
  content: string,
  coverImage?: string,
  order?: number,
  series?: string,
  top?: boolean,
  status?: "draft" | "published"
): Promise<{ slug: string; isUpdate: boolean }> {
  if (!title.trim()) throw new Error("Title is required");
  if (!content.trim()) throw new Error("Content is required");

  const slug = generateSlug(title);
  const effectiveStatus = status || "published";
  const type = effectiveStatus === "draft" ? "drafts" : "posts";
  const fileContent = buildPostContent(title, date, description, content, coverImage, order, series, top);

  if (isGitHubMode) {
    // Retry with new random suffix if slug collides (same second + same random)
    let finalSlug = slug;
    let slugPath = repoFilePath(type, finalSlug);
    let existing = await getContentFile(slugPath);
    while (existing) {
      const rand = Math.floor(Math.random() * 900 + 100);
      finalSlug = `${slug.replace(/-\d{3}$/, "")}-${rand}`;
      slugPath = repoFilePath(type, finalSlug);
      existing = await getContentFile(slugPath);
    }

    console.log("Writing post to blog-images:", { path: slugPath, title, status: effectiveStatus });
    await putContentFile(slugPath, fileContent,
      effectiveStatus === "draft" ? `Save draft: ${title}` : `Create post: ${title}`);

    // When publishing, clean up any existing draft
    if (effectiveStatus === "published") {
      const draftPath = repoFilePath("drafts", finalSlug);
      const draftFile = await getContentFile(draftPath);
      if (draftFile) {
        await deleteContentFile(draftPath, draftFile.sha, `Publish: remove draft ${finalSlug}`);
      }
    }

    return { slug: finalSlug, isUpdate: false };
  }

  const filePath = resolvePostPath(slug, type);
  if (fs.existsSync(filePath)) {
    // Local fs collision — also retry
    let finalSlug = slug;
    let finalPath = filePath;
    while (fs.existsSync(finalPath)) {
      const rand = Math.floor(Math.random() * 900 + 100);
      finalSlug = `${slug.replace(/-\d{3}$/, "")}-${rand}`;
      finalPath = resolvePostPath(finalSlug, type);
    }
    fs.writeFileSync(finalPath, fileContent, "utf8");
    // When publishing, clean up any existing draft
    if (effectiveStatus === "published") {
      const draftPath = resolvePostPath(finalSlug, "drafts");
      if (fs.existsSync(draftPath)) fs.unlinkSync(draftPath);
    }
    return { slug: finalSlug, isUpdate: false };
  }

  fs.writeFileSync(filePath, fileContent, "utf8");

  // When publishing, clean up any existing draft
  if (effectiveStatus === "published") {
    const draftPath = resolvePostPath(slug, "drafts");
    if (fs.existsSync(draftPath)) {
      fs.unlinkSync(draftPath);
    }
  }

  return { slug, isUpdate: false };
}

export async function updatePost(
  slug: string,
  data: { title?: string; date?: string; description?: string; content?: string; coverImage?: string; order?: number; series?: string; top?: boolean; status?: "draft" | "published" },
  source: "posts" | "drafts" = "posts"
): Promise<{ slug: string }> {
  let existing: { data: Record<string, string>; content: string };
  let existingSha: string | undefined;

  if (isGitHubMode) {
    const readPath = repoFilePath(source, slug);
    const file = await getContentFile(readPath);
    if (!file) throw new Error(`Post "${slug}" not found in ${source}`);
    existing = matter(file.content);
    existingSha = file.sha;
  } else {
    const filePath = resolvePostPath(slug, source);
    const fileContents = fs.readFileSync(filePath, "utf8");
    existing = matter(fileContents);
  }

  const newTitle = data.title || existing.data.title;
  const newDate = data.date || existing.data.date;
  const newDescription = data.description || existing.data.description;
  const newCoverImage = data.coverImage !== undefined ? data.coverImage : existing.data.coverImage;
  const newContent = data.content !== undefined ? data.content : existing.content;
  const newOrder = data.order !== undefined ? data.order : (existing.data.order ? Number(existing.data.order) : 0);
  const newSeries = data.series !== undefined ? data.series : (existing.data.series || "");
  const newTop = data.top !== undefined ? data.top : ((existing as any).data.top === true);
  const newStatus = data.status || (source === "drafts" ? "draft" : "published");
  const targetType = newStatus === "draft" ? "drafts" : "posts";

  const existingTimestamp = extractTimestamp(slug);
  const newTitleSlug = sanitizeSlug(newTitle).slice(0, 20);

  // 只在标题真正变化时才重算 slug，否则保留原 slug（含随机后缀）
  let newSlug = slug;
  if (data.title && data.title !== existing.data.title) {
    newSlug = existingTimestamp
      ? `${existingTimestamp}-${newTitleSlug}`
      : generateSlug(newTitle);
  }
  const fileContent = buildPostContent(newTitle, newDate, newDescription, newContent, newCoverImage, newOrder, newSeries, newTop);

  if (isGitHubMode) {
    const writePath = repoFilePath(targetType, newSlug);
    console.log("Updating post in blog-images:", { from: slug, to: newSlug, source, target: targetType });

    if (newSlug !== slug || targetType !== source) {
      // Slug changed or status changed — move the file
      // 1. Check if target already exists and get its SHA (upsert)
      const existingTarget = await getContentFile(writePath);
      const targetSha = existingTarget?.sha;

      // If target slug is different and already exists → conflict
      if (existingTarget && newSlug !== slug) {
        throw new Error(`A post with slug "${newSlug}" already exists`);
      }

      // 2. Write to target first (create or overwrite, with SHA if updating)
      await putContentFile(writePath, fileContent,
        `Move post: ${slug} → ${newSlug} (${source} → ${targetType})`,
        targetSha);

      // 3. Delete source file after successful write
      const oldFile = await getContentFile(repoFilePath(source, slug));
      if (oldFile) {
        await deleteContentFile(repoFilePath(source, slug), oldFile.sha,
          `Delete old: ${slug} from ${source}`);
      }
    } else {
      await putContentFile(writePath, fileContent, `Update post: ${newTitle}`, existingSha);
    }

    console.log("Post update successful");
    return { slug: newSlug };
  }

  const oldPath = resolvePostPath(slug, source);
  const newPath = resolvePostPath(newSlug, targetType);

  if (newSlug !== slug || targetType !== source) {
    if (fs.existsSync(newPath) && newSlug !== slug) {
      throw new Error(`A post with slug "${newSlug}" already exists`);
    }
    fs.writeFileSync(newPath, fileContent, "utf8");
    fs.unlinkSync(oldPath);
  } else {
    fs.writeFileSync(oldPath, fileContent, "utf8");
  }

  return { slug: newSlug };
}

export async function deletePost(slug: string, source: "posts" | "drafts" = "posts"): Promise<void> {
  if (isGitHubMode) {
    const repoPath = repoFilePath(source, slug);
    console.log("Deleting post from blog-images:", { path: repoPath });
    const file = await getContentFile(repoPath);
    if (!file) throw new Error(`Post "${slug}" not found in ${source}`);
    await deleteContentFile(repoPath, file.sha, `Delete post: ${slug}`);
    console.log("Post deleted successfully");
    return;
  }

  const filePath = resolvePostPath(slug, source);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post "${slug}" not found in ${source}`);
  }
  fs.unlinkSync(filePath);
}
