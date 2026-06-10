import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { predictions, participants, rooms } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function getParticipant(token: string) {
  return db.query.participants.findFirst({
    where: eq(participants.sessionToken, token),
  });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const code = req.nextUrl.searchParams.get("code");
  if (!token || !code) return NextResponse.json({ predictions: [] });

  const participant = await getParticipant(token);
  if (!participant) return NextResponse.json({ predictions: [] });

  const preds = await db.query.predictions.findMany({
    where: eq(predictions.participantId, participant.id),
  });

  return NextResponse.json({ predictions: preds });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Sin autorización" }, { status: 401 });

  const { code, matchId, scoreHome, scoreAway, lockedAt } = await req.json();

  const participant = await getParticipant(token);
  if (!participant) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });

  // verificar que no esté bloqueado
  if (new Date(lockedAt) <= new Date()) {
    return NextResponse.json({ error: "El partido ya comenzó" }, { status: 403 });
  }

  // upsert: si ya existe, actualizar
  const existing = await db.query.predictions.findFirst({
    where: and(
      eq(predictions.participantId, participant.id),
      eq(predictions.matchId, matchId)
    ),
  });

  let prediction;
  if (existing) {
    [prediction] = await db.update(predictions)
      .set({ scoreHome, scoreAway })
      .where(eq(predictions.id, existing.id))
      .returning();
  } else {
    [prediction] = await db.insert(predictions).values({
      participantId: participant.id,
      matchId,
      scoreHome,
      scoreAway,
      lockedAt: new Date(lockedAt),
    }).returning();
  }

  return NextResponse.json({ prediction });
}