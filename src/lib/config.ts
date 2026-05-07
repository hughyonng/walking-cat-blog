import fs from "fs";
import path from "path";
import { isGitHubMode, getContentFile, putContentFile } from "@/lib/github";

export interface SiteConfig {
  siteTitle: string;
  siteSubtitle: string;
  adminEmail: string;
  adminPassword: string;
  about: {
    introduction: string;
    github: string;
    email: string;
    x: string;
    avatar: string;
  };
}

const configPath = path.join(process.cwd(), "src", "data", "site-config.json");
const REPO_CONFIG_PATH = "site-config.json";

const defaultConfig: SiteConfig = {
  siteTitle: "行走的猫",
  siteSubtitle: "一个数字游民关于技术、现代与人文的思考",
  adminEmail: "hughyonng@gmail.com",
  adminPassword: "121@sd4545",
  about: {
    introduction: "",
    github: "",
    email: "",
    x: "",
    avatar: "",
  },
};

export async function getSiteConfig(): Promise<SiteConfig> {
  let config: SiteConfig;

  if (isGitHubMode) {
    const file = await getContentFile(REPO_CONFIG_PATH);
    if (file) {
      const raw = JSON.parse(file.content);
      config = {
        ...defaultConfig,
        ...raw,
        about: { ...defaultConfig.about, ...(raw.about || {}) },
      };
    } else {
      config = { ...defaultConfig };
    }
  } else {
    try {
      const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
      config = {
        ...defaultConfig,
        ...raw,
        about: { ...defaultConfig.about, ...(raw.about || {}) },
      };
    } catch {
      config = { ...defaultConfig };
    }
  }

  // Environment variables override file config (critical for Vercel deployment)
  if (process.env.ADMIN_EMAIL) config.adminEmail = process.env.ADMIN_EMAIL;
  if (process.env.ADMIN_PASSWORD) config.adminPassword = process.env.ADMIN_PASSWORD;

  // Strip legacy fields that may linger in stored JSON
  delete (config.about as any).zhihu;
  delete (config.about as any).skills;

  return config;
}

export async function updateSiteConfig(data: Partial<SiteConfig>): Promise<SiteConfig> {
  const current = await getSiteConfig();
  const updated = {
    ...current,
    ...data,
    about: data.about ? { ...current.about, ...data.about } : current.about,
  };

  // Strip any legacy fields before persisting
  delete (updated.about as any).zhihu;
  delete (updated.about as any).skills;

  if (isGitHubMode) {
    const existing = await getContentFile(REPO_CONFIG_PATH);
    const sha = existing?.sha;
    await putContentFile(
      REPO_CONFIG_PATH,
      JSON.stringify(updated, null, 2),
      "Update site configuration",
      sha
    );
  } else {
    // Local dev: write to file directly
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), "utf8");
  }

  return updated;
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const config = await getSiteConfig();
  return email === config.adminEmail && password === config.adminPassword;
}
