import MainLayout from "@/components/layout/MainLayout";
import { getSiteConfig } from "@/lib/config";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { siteTitle } = getSiteConfig();

  return (
    <>
      <MainLayout>{children}</MainLayout>
      <footer className="border-t border-border mt-auto">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} {siteTitle}. All rights reserved.
        </div>
      </footer>
    </>
  );
}
