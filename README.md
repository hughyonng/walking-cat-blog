# 行走的猫 · Walking Cat Blog

A minimalist personal blog built with Next.js, featuring an admin CMS with rich text editing, image upload to Vercel Blob, and GitHub-based content synchronization.

## Tech Stack

| Layer        | Technology |
| ------------ | ---------- |
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| UI Components | Custom + Shadcn UI |
| Rich Text Editor | [TipTap](https://tiptap.dev) (ProseMirror-based) |
| Image Storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) |
| Content Sync | GitHub Contents API |
| Auth | JWT (httpOnly cookie via `jose`) |
| Font | [Geist](https://vercel.com/font) |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the blog.

### Environment Variables

Create `.env.local` in the project root:

```env
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password

# GitHub API (optional — enables sync-to-repo on admin writes)
# GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo
GITHUB_BRANCH=production

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx
```

## Deployment

### Vercel Environment Variables

Configure these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable              | Description |
|---|---|
| `JWT_SECRET` | JWT signing secret |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |
| `GITHUB_TOKEN` | GitHub personal access token (with `repo` scope) |
| `GITHUB_OWNER` | GitHub username |
| `GITHUB_REPO` | Repository name |
| `GITHUB_BRANCH` | Branch for content sync (e.g., `production`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read-write token |

### Blob Store Setup

1. Go to [Vercel Dashboard → Storage](https://vercel.com/dashboard/storage)
2. Create a new Blob Store
3. In Store Settings, set access to **Public** (required for image display)
4. Copy `BLOB_READ_WRITE_TOKEN` to Vercel environment variables and `.env.local`

## Admin CMS

Access the admin panel at `/admin/login`.

- **Login** — authenticate with email + password
- **Dashboard** — view, edit, delete all posts
- **New Post** — rich text editor with image upload
- **Settings** — update site title, subtitle, admin email, password

## Project Structure

```text
src/
├── app/
│   ├── (blog)/          # Public blog pages (home, posts, about)
│   ├── (admin)/         # Admin pages (login, dashboard, settings)
│   └── api/             # API routes (auth, posts, upload, settings)
├── components/
│   ├── admin/           # Admin components (RichEditor, PostEditor, etc.)
│   └── blog/            # Blog components (PostCard, etc.)
├── lib/
│   ├── auth.ts          # JWT helpers (sign, verify)
│   ├── config.ts        # Site config read/write
│   ├── github.ts        # GitHub Contents API client
│   ├── posts.ts         # Post CRUD operations
│   └── render-content.ts # Content rendering (HTML/markdown)
├── data/
│   └── site-config.json # Persisted site settings
└── posts/               # Markdown post files
```

## Troubleshooting

### 1. Image Upload Returns 403 Forbidden

**Cause:** The `put()` call uses `access: "public"` but the Vercel Blob Store is set to **Private**, or vice versa.

**Fix:** Ensure both sides match:

```typescript
// src/app/api/upload/route.ts — put() must use public access
const blob = await put(file.name, file, {
  access: "public",       // ✅ required for public image URLs
  addRandomSuffix: true,
  token: BLOB_TOKEN,
});
```

And the Blob Store in Vercel Dashboard → Storage must be set to **Public**.

**Verification:** After a successful upload, the returned URL should contain `.public.blob.vercel-storage.com`, not `.private.blob.vercel-storage.com`.

### 2. Images Not Loading Locally (AdGuard / Firewall)

**Cause:** Local network security tools (AdGuard, Pi-hole, corporate VPN) may block `*.vercel-storage.com` domains.

**Symptoms:** Images upload successfully (return a URL) but never load in the editor or browser; console shows network errors to `*.blob.vercel-storage.com`.

**Fix:**

- Temporarily disable AdGuard while testing image uploads
- Or add `*.vercel-storage.com` to AdGuard's allowlist
- Or use Vercel preview deployments for image testing instead of localhost

### 3. TipTap Extension Conflict (Duplicate Link)

**Cause:** `StarterKit` from `@tiptap/starter-kit` includes a built-in `link` extension, and a standalone `LinkExtension` from `@tiptap/extension-link` is also added manually.

**Symptoms:** Console warning about duplicate extensions; link button may behave unpredictably.

**Fix:** Disable the built-in `link` in `StarterKit`:

```typescript
StarterKit.configure({
  heading: { levels: [1, 2, 3] },
  link: false,  // ✅ prevents duplicate — use standalone LinkExtension instead
}),
```

### 4. Site Settings Not Persisting After Refresh

**Cause:** `updateSiteConfig()` in `src/lib/config.ts` was blocked by a conditional that skipped file writes when `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars were set.

**Fix (already applied):** The condition was changed from `else if (...)` to plain `else`, ensuring file writes always happen in non-GitHub mode.

**Cache:** If the homepage still shows stale data after saving, the settings API route calls `revalidatePath("/", "layout")` to bust Next.js route cache. If you remove or modify this, add it back:

```typescript
import { revalidatePath } from "next/cache";

// After successful update:
revalidatePath("/", "layout");
revalidatePath("/about", "page");
```

## Maintenance Commands

```bash
# Stage all changes and commit
git add .
git commit -m "description of changes"

# Push to main branch
git push origin main

# Sync production branch (triggers Vercel deploy)
git checkout production
git merge main --ff-only
git push origin production
git checkout main
```

After updating site settings (title, subtitle, etc.), the API automatically calls `revalidatePath()` to refresh the homepage. If caching issues persist, add `export const dynamic = "force-dynamic"` to any page that must always render fresh.
