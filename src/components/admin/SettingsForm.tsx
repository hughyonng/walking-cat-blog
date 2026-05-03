"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SiteConfig {
  siteTitle: string;
  siteSubtitle: string;
  adminEmail: string;
}

export default function SettingsForm() {
  const router = useRouter();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => setMessage({ type: "error", text: "无法加载设置" }));
  }, []);

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.siteTitle.trim()) {
      setMessage({ type: "error", text: "网站名称不能为空" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const body: Record<string, string> = {
        siteTitle: config.siteTitle,
        siteSubtitle: config.siteSubtitle,
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "保存失败");
      }

      setMessage({ type: "success", text: "设置已保存" });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.adminEmail.trim()) {
      setMessage({ type: "error", text: "邮箱不能为空" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: config.adminEmail }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "保存失败");
      }

      setMessage({ type: "success", text: "邮箱已更新" });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setMessage({ type: "error", text: "请输入当前密码" });
      return;
    }
    if (!newPassword) {
      setMessage({ type: "error", text: "请输入新密码" });
      return;
    }
    if (newPassword.length < 3) {
      setMessage({ type: "error", text: "新密码至少 3 个字符" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "两次输入的新密码不一致" });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "密码修改失败");
      }

      setMessage({ type: "success", text: "密码已更新" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "密码修改失败" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!config) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <p className="text-muted">加载中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-10">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        站点设置
      </h1>

      {message && (
        <div
          className={`text-sm px-4 py-3 rounded-lg border ${
            message.type === "success"
              ? "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
              : "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Site Info Section */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4 pb-3 border-b border-border/60">
          基本信息
        </h2>
        <form onSubmit={handleSaveSite} className="space-y-5">
          <div>
            <label htmlFor="siteTitle" className="block text-sm font-medium text-foreground mb-1.5">
              网站名称
            </label>
            <input
              id="siteTitle"
              type="text"
              value={config.siteTitle}
              onChange={(e) => setConfig({ ...config, siteTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
              placeholder="输入网站名称"
            />
          </div>
          <div>
            <label htmlFor="siteSubtitle" className="block text-sm font-medium text-foreground mb-1.5">
              副标题
            </label>
            <input
              id="siteSubtitle"
              type="text"
              value={config.siteSubtitle}
              onChange={(e) => setConfig({ ...config, siteSubtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
              placeholder="输入副标题"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium
                hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存基本信息"}
            </button>
          </div>
        </form>
      </section>

      {/* Admin Email Section */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4 pb-3 border-b border-border/60">
          管理员邮箱
        </h2>
        <form onSubmit={handleSaveEmail} className="space-y-5">
          <div>
            <label htmlFor="adminEmail" className="block text-sm font-medium text-foreground mb-1.5">
              登录邮箱
            </label>
            <input
              id="adminEmail"
              type="email"
              value={config.adminEmail}
              onChange={(e) => setConfig({ ...config, adminEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
              placeholder="输入管理员邮箱"
            />
            <p className="mt-1.5 text-xs text-muted">登录后台时需使用此邮箱地址</p>
          </div>
          <div>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium
                hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "保存中..." : "更新邮箱"}
            </button>
          </div>
        </form>
      </section>

      {/* Password Change Section */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4 pb-3 border-b border-border/60">
          修改登录密码
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-1.5">
              当前密码
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
              placeholder="输入当前密码"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1.5">
                新密码
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
                placeholder="输入新密码"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                确认新密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
                placeholder="再次输入新密码"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium
                hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {changingPassword ? "修改中..." : "修改密码"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
