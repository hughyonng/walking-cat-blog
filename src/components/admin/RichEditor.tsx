"use client";

import { useCallback, useState, useEffect } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { mdToHtml, isHtmlContent } from "@/lib/render-content";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichEditor({ content, onChange, placeholder }: RichEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // Convert legacy markdown to HTML for TipTap
  const initialHtml = isHtmlContent(content) ? content : mdToHtml(content);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({
        placeholder: placeholder || "开始写作...",
      }),
    ],
    content: initialHtml,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-0 py-4" +
          " prose-headings:font-semibold prose-headings:tracking-tight" +
          " prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3" +
          " prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2" +
          " prose-p:leading-relaxed prose-p:text-foreground/80 prose-p:my-2" +
          " prose-a:text-accent prose-a:no-underline hover:prose-a:underline" +
          " prose-code:font-mono prose-code:text-sm prose-code:bg-muted/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded" +
          " prose-pre:bg-[#1a1a2e] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg prose-pre:text-sm" +
          " prose-blockquote:border-l-accent prose-blockquote:text-muted prose-blockquote:not-italic" +
          " prose-strong:font-semibold" +
          " prose-ul:space-y-1 prose-li:leading-relaxed" +
          " prose-img:rounded-xl prose-img:shadow-md prose-img:ring-1 prose-img:ring-black/5 prose-img:my-6" +
          " [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit" +
          " [&_p.is-editor-empty:first-child]:before:text-muted/40 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0",
      },
    },
  });

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.title = "选择要插入的图片";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        // Validate the returned URL
        const uploadedUrl = data.url;
        if (!uploadedUrl || typeof uploadedUrl !== "string") {
          throw new Error("服务器未返回有效的图片地址");
        }
        if (!uploadedUrl.startsWith("https://")) {
          throw new Error("图片地址格式异常: " + uploadedUrl.slice(0, 40));
        }
        console.log("Image upload response data:", JSON.stringify(data));
        console.log("Image uploaded URL:", uploadedUrl);

        // Insert image into editor — try setImage first, fall back to insertContent
        const inserted = editor.chain().focus().setImage({ src: uploadedUrl }).run();
        if (!inserted) {
          console.warn("setImage returned false, trying insertContent fallback");
          editor
            .chain()
            .focus()
            .insertContent(`<img src="${uploadedUrl}" alt="uploaded image" style="max-width:100%" />`)
            .run();
        }
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("图片上传失败: " + (err instanceof Error ? err.message : "未知错误"));
      }
    };
    input.click();
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor || !linkUrl.trim()) return;
    editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const addImageUrl = useCallback(() => {
    if (!editor || !imageUrl.trim()) return;
    editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
    setImageUrl("");
    setShowImageInput(false);
  }, [editor, imageUrl]);

  if (!mounted || !editor) {
    return (
      <div className="border border-border rounded-xl bg-background overflow-hidden min-h-[200px] flex items-center justify-center">
        <span className="text-sm text-muted/50">加载编辑器中...</span>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="B"
          title="加粗"
          className="font-bold min-w-[30px]"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="I"
          title="斜体"
          className="italic font-serif min-w-[30px]"
        />
        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          label="H1"
          title="一级标题"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          label="H2"
          title="二级标题"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          label="H3"
          title="三级标题"
        />
        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label="≡"
          title="无序列表"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label="#"
          title="有序列表"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          label=""
          title="引用"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5h3L4 9H3V5zm6 0h3l-2 4H9V5z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          label="{ }"
          title="代码块"
        />
        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          active={editor.isActive("link")}
          label=""
          title="插入链接"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 9.5a3.5 3.5 0 005.05-.45l2-2a3.5 3.5 0 00-4.95-4.95L7 3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.5 6.5a3.5 3.5 0 00-5.05.45l-2 2a3.5 3.5 0 004.95 4.95L9 12.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={handleImageUpload}
          active={false}
          label=""
          title="上传图片"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
            <circle cx="5.5" cy="6" r="1.5" />
            <path d="M1.5 11l3.5-3 2 2 2.5-2.5L14.5 11" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Link popover */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/10">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="输入链接 URL..."
            className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent/30"
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <button
            type="button"
            onClick={addLink}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:opacity-90"
          >
            插入
          </button>
          <button
            type="button"
            onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); }}
            className="px-3 py-1.5 text-xs rounded-md border border-border text-muted hover:text-foreground"
          >
            移除
          </button>
        </div>
      )}

      {/* Image URL popover */}
      {showImageInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/10">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="输入图片 URL..."
            className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent/30"
            onKeyDown={(e) => e.key === "Enter" && addImageUrl()}
          />
          <button
            type="button"
            onClick={addImageUrl}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:opacity-90"
          >
            插入
          </button>
        </div>
      )}

      {/* Editor body */}
      <div className="px-5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  title,
  className = "",
  children,
}: {
  onClick: () => void;
  active: boolean;
  label?: string;
  title: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center h-8 px-1.5 rounded-md text-sm transition-colors
        ${active
          ? "bg-accent/15 text-accent"
          : "text-muted hover:text-foreground hover:bg-muted/20"
        } ${className}`}
    >
      {children || label}
    </button>
  );
}
