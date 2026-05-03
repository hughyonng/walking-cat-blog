"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "文章" },
  { href: "/about", label: "关于" },
];

export default function Header({ siteTitle }: { siteTitle: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground hover:text-accent transition-colors"
        >
          {siteTitle}
        </Link>

        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  pathname === item.href
                    ? "text-accent font-medium"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Walking Cat */}
          <motion.div
            className="h-[60px] sm:h-[100px] flex items-center justify-center overflow-visible mr-2 sm:mr-6"
            animate={{ x: [0, 5, 0, -5, 0] }}
            transition={{
              duration: 1.0,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src="/images/cat-walking.gif"
              alt="行走的猫"
              className="h-full w-auto object-contain"
              draggable={false}
            />
          </motion.div>
        </div>
      </div>
    </header>
  );
}
