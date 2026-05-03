import { getAllPosts } from "@/lib/posts";
import Link from "next/link";
import DeletePostButton from "./DeletePostButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          文章列表
        </h1>
        <Link
          href="/admin/dashboard/new"
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium
            hover:opacity-90 transition-opacity"
        >
          写新文章
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted">暂无文章</p>
          <Link
            href="/admin/dashboard/new"
            className="inline-block mt-3 text-sm text-accent hover:underline"
          >
            创建第一篇文章
          </Link>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  标题
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted hidden sm:table-cell">
                  日期
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.slug}
                  className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div>
                      <Link
                        href={`/admin/dashboard/edit/${encodeURIComponent(post.slug)}`}
                        className="text-foreground hover:text-accent transition-colors font-medium"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted mt-0.5 sm:hidden">
                        {formatDate(post.date)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted hidden sm:table-cell">
                    {formatDate(post.date)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/dashboard/edit/${encodeURIComponent(post.slug)}`}
                        className="text-xs text-muted hover:text-accent transition-colors"
                      >
                        编辑
                      </Link>
                      <DeletePostButton slug={post.slug} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
