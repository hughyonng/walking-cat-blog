import fs from "fs";
import path from "path";

export interface SiteConfig {
  siteTitle: string;
  siteSubtitle: string;
  adminEmail: string;
  adminPassword: string;
}

const configPath = path.join(process.cwd(), "src", "data", "site-config.json");

const defaultConfig: SiteConfig = {
  siteTitle: "行走的猫",
  siteSubtitle: "一个数字游民关于技术、现代与人文的思考",
  adminEmail: "hughyonng@gmail.com",
  adminPassword: "121@sd4545",
};

let cachedConfig: SiteConfig | null = null;

export function getSiteConfig(): SiteConfig {
  if (cachedConfig) return cachedConfig;

  let config: SiteConfig;

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    config = { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    config = { ...defaultConfig };
  }

  // Environment variables override file config (critical for Vercel deployment)
  if (process.env.ADMIN_EMAIL) config.adminEmail = process.env.ADMIN_EMAIL;
  if (process.env.ADMIN_PASSWORD) config.adminPassword = process.env.ADMIN_PASSWORD;

  cachedConfig = config;
  return config;
}

export function updateSiteConfig(data: Partial<SiteConfig>): SiteConfig {
  const current = getSiteConfig();
  const updated = { ...current, ...data };

  // Don't write admin credentials to file when env vars are active (Vercel)
  if (!process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), "utf8");
  }

  cachedConfig = updated;
  return updated;
}

export function verifyAdminCredentials(
  email: string,
  password: string
): boolean {
  const config = getSiteConfig();
  return email === config.adminEmail && password === config.adminPassword;
}
