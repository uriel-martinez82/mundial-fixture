import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rooms, participants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Falta el código" }, { status: 400 });
  }

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.code, code.toUpperCase()),
  });

  if (!room) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }

  const members = await db.query.participants.findMany({
    where: eq(participants.roomId, room.id),
    orderBy: (p, { desc }) => [desc(p.totalPts)],
  });

  return NextResponse.json({ room, members });
}