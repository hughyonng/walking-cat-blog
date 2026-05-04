import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getSiteConfig, updateSiteConfig, type SiteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getSiteConfig();
  // Never expose password to client
  const { adminPassword, ...safe } = config;
  return NextResponse.json(safe);
}

export async function PUT(request: NextRequest) {
  const token = await getTokenFromRequest(request);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { siteTitle, siteSubtitle, adminEmail, currentPassword, newPassword, about } = body;

    const currentConfig = await getSiteConfig();

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "请输入当前密码" }, { status: 400 });
      }
      if (currentPassword !== currentConfig.adminPassword) {
        return NextResponse.json({ error: "当前密码错误" }, { status: 403 });
      }
      if (newPassword.length < 3) {
        return NextResponse.json({ error: "新密码至少 3 个字符" }, { status: 400 });
      }
    }

    const updates: Partial<SiteConfig> = {};

    if (siteTitle?.trim()) updates.siteTitle = siteTitle.trim();
    if (siteSubtitle !== undefined) updates.siteSubtitle = siteSubtitle.trim();
    if (adminEmail?.trim()) updates.adminEmail = adminEmail.trim();
    if (newPassword) updates.adminPassword = newPassword;
    if (about && typeof about === "object") updates.about = about;

    const updated = await updateSiteConfig(updates);

    // Bust cache for public pages
    revalidatePath("/", "layout");
    revalidatePath("/about", "page");

    // Never expose password
    const { adminPassword: _, ...safe } = updated;
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
