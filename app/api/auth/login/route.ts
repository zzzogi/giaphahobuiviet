import { NextRequest, NextResponse } from "next/server";
import { signAdminToken } from "@/libs/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json(
      { error: "Sai tên đăng nhập hoặc mật khẩu" },
      { status: 401 },
    );
  }

  const token = await signAdminToken();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
