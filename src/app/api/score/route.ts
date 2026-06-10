import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { predictions, participants } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { footballApi } from "@/lib/football";

export async function POST(req: NextRequest) {
  // Protección simple con secret
  const secret = req.headers.get("x-score-secret");
  if (secret !== process.env.SCORE_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Traer todas las predicciones sin puntuar
  const pending = await db.query.predictions.findMany({
    where: isNull(predictions.pointsEarned),
  });

  if (pending.length === 0) {
    return NextResponse.json({ message: "Sin predicciones pendientes", updated: 0 });
  }

  // Agrupar por matchId para no pegar a la API más de una vez por partido
  const matchIds = [...new Set(pending.map(p => p.matchId))];

  let updated = 0;
  const errors: string[] = [];

  for (const matchId of matchIds) {
    try {
      const data = await footballApi.match(matchId);

      // Solo procesar partidos finalizados
      if (data.status !== "FINISHED") continue;

      const realHome = data.score?.fullTime?.home;
      const realAway = data.score?.fullTime?.away;
      if (realHome === null || realAway === null || realHome === undefined || realAway === undefined) continue;

      // Calcular puntos para cada predicción de este partido
      const matchPredictions = pending.filter(p => p.matchId === matchId);

      for (const pred of matchPredictions) {
        let points = 0;

        const exactHome = pred.scoreHome === realHome;
        const exactAway = pred.scoreAway === realAway;

        if (exactHome && exactAway) {
          // Marcador exacto
          points = 3;
        } else {
          // Verificar si acertó el resultado (ganador o empate)
          const predResult = pred.scoreHome > pred.scoreAway ? "H" : pred.scoreHome < pred.scoreAway ? "A" : "D";
          const realResult = realHome > realAway ? "H" : realHome < realAway ? "A" : "D";
          if (predResult === realResult) points = 1;
        }

        // Guardar puntos en la predicción
        await db.update(predictions)
          .set({ pointsEarned: points })
          .where(eq(predictions.id, pred.id));

        // Sumar al total del participante
        if (points > 0) {
          const participant = await db.query.participants.findFirst({
            where: eq(participants.id, pred.participantId),
          });
          if (participant) {
            await db.update(participants)
              .set({ totalPts: participant.totalPts + points })
              .where(eq(participants.id, pred.participantId));
          }
        }

        updated++;
      }
    } catch (e: any) {
      errors.push(`match ${matchId}: ${e.message}`);
    }
  }

  return NextResponse.json({ message: "Puntuación completada", updated, errors });
}