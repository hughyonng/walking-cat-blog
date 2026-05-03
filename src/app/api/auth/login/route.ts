import { NextRequest, NextResponse } from "next/server";
import { signToken, verifyCredentials } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!verifyCredentials(email, password)) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    const token = await signToken({ username: email });

    const response = NextResponse.json({ success: true, email });
    response.headers.set(
      "Set-Cookie",
      `token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
