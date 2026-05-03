---
title: "React Server Components 实战指南"
date: "2026-04-15"
description: "深入理解 RSC 的数据获取模式和最佳实践"
coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop"
---

## React Server Components 实战指南

React Server Components（RSC）代表了 React 应用架构的一次根本性变革。它让组件可以仅在服务器端运行，只将渲染结果发送到客户端。

## 为什么使用 Server Components？

最显著的好处是减少 JavaScript 包体积。仅在服务器端运行的组件永远不会将它们的代码发送到浏览器：

```tsx
// 该组件仅在服务器端运行
// 它的依赖不会打包到客户端
import { readFile } from 'fs/promises';
import matter from 'gray-matter';

export default async function PostContent({ slug }: { slug: string }) {
  const file = await readFile(`content/${slug}.md`, 'utf8');
  const { content } = matter(file);
  return <article>{content}</article>;
}
```

## 数据获取模式

RSC 让你可以直接在需要的组件中获取数据，无需 useEffect 或状态管理库：

```tsx
async function UserProfile({ userId }: { userId: string }) {
  const user = await db.users.findById(userId);
  const posts = await db.posts.findByAuthor(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 何时使用 Client Components

交互性仍然需要 Client Components。原则是：默认使用 Server Components，只在需要时才添加 `"use client"`：

- 事件处理（`onClick`、`onSubmit`）
- 状态和副作用（`useState`、`useEffect`）
- 浏览器专用 API
- 依赖客户端状态的自定义 hooks

```tsx
"use client";

import { useState } from "react";

export function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? "❤️ 已点赞" : "🤍 点赞"}
    </button>
  );
}
```

Server Components 让你的应用默认更快 —— 更少的 JavaScript、更小的包体积、更快的页面加载。
