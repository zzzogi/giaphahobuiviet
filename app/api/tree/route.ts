import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prismaClient";
import { buildTreeFromFlat } from "@/libs/buildTree";
import { verifyRequestAdmin } from "@/libs/auth";

// PUBLIC: fetch entire tree
export async function GET() {
  const all = await prisma.person.findMany({ orderBy: { createdAt: "asc" } });
  const tree = buildTreeFromFlat(all);
  return NextResponse.json(tree);
}

// ADMIN: create new person
export async function POST(req: NextRequest) {
  if (!(await verifyRequestAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, gender, avatar, dob, dod, biography, parentId, isSpouseOf } =
    body;

  if (!name) {
    return NextResponse.json(
      { error: "Tên không được để trống" },
      { status: 400 },
    );
  }

  const person = await prisma.person.create({
    data: { name, gender, avatar, dob, dod, biography, parentId, isSpouseOf },
  });

  return NextResponse.json(person, { status: 201 });
}
