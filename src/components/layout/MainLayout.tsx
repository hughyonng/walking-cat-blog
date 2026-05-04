import { ReactNode } from "react";
import { getSiteConfig } from "@/lib/config";
import Header from "./Header";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const { siteTitle } = await getSiteConfig();

  return (
    <>
      <Header siteTitle={siteTitle} />
      <main className="flex-1">{children}</main>
    </>
  );
}
