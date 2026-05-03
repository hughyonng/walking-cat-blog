"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminHeader() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/admin/dashboard"
            className="text-base font-semibold text-foreground hover:text-accent transition-colors"
          >
            Admin
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin/dashboard"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              文章列表
            </Link>
            <Link
              href="/admin/dashboard/new"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              写文章
            </Link>
            <Link
              href="/admin/dashboard/settings"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              站点设置
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-muted hover:text-accent transition-colors"
            target="_blank"
          >
            查看博客 ↗
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            {loggingOut ? "退出中..." : "退出登录"}
          </button>
        </div>
      </div>
    </header>
  );
}
