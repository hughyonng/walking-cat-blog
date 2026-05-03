"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePostButton({
  slug,
}: {
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      router.refresh();
    } catch {
      alert("删除失败，请重试");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return confirming ? (
    <span className="flex items-center gap-2 text-xs">
      <span className="text-red-500">确认删除?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {deleting ? "删除中..." : "确认"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-muted hover:text-foreground transition-colors"
      >
        取消
      </button>
    </span>
  ) : (
    <button
      onClick={handleDelete}
      className="text-xs text-muted hover:text-red-500 transition-colors"
    >
      删除
    </button>
  );
}
