"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminHeader from "./AdminHeader";

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showHeader = pathname !== "/admin/login";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && <AdminHeader />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
