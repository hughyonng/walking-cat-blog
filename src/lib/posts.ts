import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "src", "posts");

/** Vercel serverless environment has a read-only filesystem */
const isReadonlyFS = !!process.env.VERCEL;

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

function readPostFile(slug: string): { data: Record<string, string>; content: string } {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  return matter(fileContents);
}

export function getPostSlugs(): string[] {
  return fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function getDefaultCoverImage(slug: string): string {
  return `https://picsum.photos/seed/${slug}/800/600`;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const { data, content } = readPostFile(slug);
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
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => {
      try {
        const { data } = readPostFile(slug);
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
    .filter((p): p is PostMeta => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s一-鿿-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "untitled";
}

function resolvePostPath(slug: string): string {
  const resolved = path.resolve(postsDirectory, `${slug}.md`);
  if (!resolved.startsWith(path.resolve(postsDirectory))) {
    throw new Error("Invalid slug: path traversal detected");
  }
  return resolved;
}

export function createPost(
  title: string,
  date: string,
  description: string,
  content: string,
  coverImage?: string
): { slug: string } {
  if (isReadonlyFS) throw new Error("Cannot create posts in serverless environment (Vercel)");
  if (!title.trim()) throw new Error("Title is required");
  if (!content.trim()) throw new Error("Content is required");

  const slug = sanitizeSlug(title);
  const filePath = resolvePostPath(slug);

  if (fs.existsSync(filePath)) {
    throw new Error(`A post with slug "${slug}" already exists`);
  }

  const frontmatter: Record<string, string> = { title, date, description };
  if (coverImage) frontmatter.coverImage = coverImage;
  const fileContent = matter.stringify(content, frontmatter);
  fs.writeFileSync(filePath, fileContent, "utf8");
  return { slug };
}

export function updatePost(
  slug: string,
  data: { title?: string; date?: string; description?: string; content?: string; coverImage?: string }
): { slug: string } {
  if (isReadonlyFS) throw new Error("Cannot edit posts in serverless environment (Vercel)");
  const existing = readPostFile(slug);
  const newTitle = data.title || existing.data.title;
  const newDate = data.date || existing.data.date;
  const newDescription = data.description || existing.data.description;
  const newCoverImage = data.coverImage !== undefined ? data.coverImage : existing.data.coverImage;
  const newContent = data.content !== undefined ? data.content : existing.content;

  const newSlug = sanitizeSlug(newTitle);
  const oldPath = resolvePostPath(slug);
  const newPath = resolvePostPath(newSlug);

  const frontmatter: Record<string, string> = {
    title: newTitle,
    date: newDate,
    description: newDescription,
  };
  if (newCoverImage) frontmatter.coverImage = newCoverImage;
  const fileContent = matter.stringify(newContent, frontmatter);

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

export function deletePost(slug: string): void {
  if (isReadonlyFS) throw new Error("Cannot delete posts in serverless environment (Vercel)");
  const filePath = resolvePostPath(slug);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post "${slug}" not found`);
  }
  fs.unlinkSync(filePath);
}
