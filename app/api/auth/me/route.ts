import { NextResponse } from "next/server";
import { getAdminSession } from "@/libs/auth";

export async function GET() {
  const isAdmin = await getAdminSession();
  return NextResponse.json({ isAdmin });
}
