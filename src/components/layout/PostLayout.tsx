import { ReactNode } from "react";
import Link from "next/link";

interface PostLayoutProps {
  children: ReactNode;
  title: string;
  date: string;
}

export default function PostLayout({ children, title, date }: PostLayoutProps) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted hover:text-accent transition-colors group mb-10"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="mr-1.5 transition-transform group-hover:-translate-x-0.5"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        返回文章列表
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        <time className="block mt-4 text-sm text-muted">{date}</time>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:leading-relaxed prose-p:text-foreground/80
        prose-a:text-accent prose-a:no-underline hover:prose-a:underline
        prose-code:font-mono prose-code:text-sm prose-code:bg-muted/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-[#1a1a2e] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg prose-pre:shadow-lg
        prose-pre:text-sm
        prose-blockquote:border-l-accent prose-blockquote:text-muted prose-blockquote:not-italic
        prose-strong:font-semibold
        prose-ul:space-y-1
        prose-li:leading-relaxed
        prose-img:rounded-lg
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit
      ">
        {children}
      </div>
    </article>
  );
}
