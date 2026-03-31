import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prismaClient";
import { verifyRequestAdmin } from "@/libs/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const nodeId = (await context.params).id;
  if (!(await verifyRequestAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, gender, avatar, dob, dod, biography } = body;

  const updated = await prisma.person.update({
    where: { id: nodeId },
    data: { name, gender, avatar, dob, dod, biography },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const nodeId = (await context.params).id;

  if (!(await verifyRequestAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Detach children (set parentId null) before deleting
  await prisma.person.updateMany({
    where: { parentId: nodeId },
    data: { parentId: nodeId },
  });
  // Detach spouses
  await prisma.person.updateMany({
    where: { isSpouseOf: nodeId },
    data: { isSpouseOf: nodeId },
  });

  await prisma.person.delete({ where: { id: nodeId } });

  return NextResponse.json({ ok: true });
}
