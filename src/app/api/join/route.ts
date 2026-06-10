import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rooms, participants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateSessionToken } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const { code, username } = await req.json();

  if (!code?.trim() || !username?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.code, code.toUpperCase()),
  });

  if (!room) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }

  // verificar que el username no esté tomado en esa sala
  const existing = await db.query.participants.findFirst({
    where: and(
      eq(participants.roomId, room.id),
      eq(participants.username, username.trim())
    ),
  });

  if (existing) {
    return NextResponse.json({ error: "Ese nombre ya está en uso en esta sala" }, { status: 409 });
  }

  const sessionToken = generateSessionToken();

  const [participant] = await db.insert(participants).values({
    roomId: room.id,
    username: username.trim(),
    sessionToken,
  }).returning();

  return NextResponse.json({ room, participant, sessionToken });
}