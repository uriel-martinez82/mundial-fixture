import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rooms, participants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateRoomCode, generateSessionToken } from "@/lib/tokens";

// POST /api/rooms — crear sala + unirse como creador
export async function POST(req: NextRequest) {
  const { roomName, username } = await req.json();

  if (!roomName?.trim() || !username?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const code = generateRoomCode();
  const sessionToken = generateSessionToken();

  const [room] = await db.insert(rooms).values({
    code,
    name: roomName.trim(),
  }).returning();

  const [participant] = await db.insert(participants).values({
    roomId: room.id,
    username: username.trim(),
    sessionToken,
  }).returning();

  return NextResponse.json({ room, participant, sessionToken });
}

// GET /api/rooms?code=ABC123 — buscar sala por código
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

  return NextResponse.json({ room });
}