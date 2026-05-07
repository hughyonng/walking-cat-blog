"use client";

import Giscus from "@giscus/react";

export default function CommentsArea({ slug }: { slug: string }) {
  return (
    <div className="mt-16 pt-8 border-t border-border">
      <Giscus
        id="comments"
        repo="hughyonng/blog-images"
        repoId="R_kgDOSTlRPQ"
        category="Blog Comments"
        categoryId="DIC_kwDOSTlRPc4C8e_E"
        mapping="specific"
        term={slug}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="preferred_color_scheme"
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
