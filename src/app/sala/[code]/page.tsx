"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GRUPOS_WC2026, TEAM_NAMES_ES } from "@/lib/grupos";

type Participant = {
  id: string;
  username: string;
  totalPts: number;
};

type Room = {
  id: string;
  code: string;
  name: string;
  ptsExact: number;
  ptsResult: number;
};

type Match = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  homeTeam: { name: string; shortName: string; crest: string };
  awayTeam: { name: string; shortName: string; crest: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
};

type Prediction = {
  matchId: number;
  scoreHome: number;
  scoreAway: number;
  pointsEarned: number | null;
};

type Tab = "fixture" | "mundial" | "leaderboard";

export default function SalaPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [drafts, setDrafts] = useState<Record<number, { home: string; away: string }>>({});
  const [tab, setTab] = useState<Tab>("fixture");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    const name = localStorage.getItem("username");
    if (!token || !name) { router.push("/"); return; }
    setUsername(name);
    loadAll(token);
  }, []);

  async function loadAll(token: string) {
    setLoading(true);
    try {
      const [roomRes, matchRes, predRes] = await Promise.all([
        fetch(`/api/leaderboard?code=${code}`),
        fetch(`/api/worldcup?type=matches`),
        fetch(`/api/predictions?code=${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const roomData = await roomRes.json();
      const matchData = await matchRes.json();
      const predData = predRes.ok ? await predRes.json() : { predictions: [] };

      setRoom(roomData.room);
      setMembers(roomData.members);
      setMatches(matchData.matches ?? []);

      const predMap: Record<number, Prediction> = {};
      for (const p of predData.predictions ?? []) {
        predMap[p.matchId] = p;
      }
      setPredictions(predMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function savePrediction(matchId: number, kickoff: string) {
    const draft = drafts[matchId];
    if (!draft || draft.home === "" || draft.away === "") return;
    const token = localStorage.getItem("sessionToken");
    setSavingId(matchId);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          matchId,
          scoreHome: parseInt(draft.home),
          scoreAway: parseInt(draft.away),
          lockedAt: kickoff,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPredictions(prev => ({ ...prev, [matchId]: data.prediction }));
      setDrafts(prev => { const n = { ...prev }; delete n[matchId]; return n; });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingId(null);
    }
  }

  function isLocked(utcDate: string) {
    return new Date(utcDate) <= new Date();
  }

  function formatDate(utcDate: string) {
    return new Date(utcDate).toLocaleString("es-AR", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires",
    });
  }

  function statusLabel(status: string) {
    const map: Record<string, string> = {
      SCHEDULED: "Programado", TIMED: "Programado", LIVE: "En vivo",
      IN_PLAY: "En vivo", PAUSED: "Descanso", FINISHED: "Finalizado",
      POSTPONED: "Postergado", CANCELLED: "Cancelado",
    };
    return map[status] ?? status;
  }

  function statusColor(status: string) {
    if (["LIVE", "IN_PLAY", "PAUSED"].includes(status)) return "text-green-400";
    if (status === "FINISHED") return "text-zinc-500";
    return "text-zinc-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">{room?.name}</h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              Código: <span className="font-mono text-zinc-300">{code}</span>
              {" · "}Hola, <span className="text-green-400">{username}</span>
            </p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(code as string)}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors"
          >
            Copiar código
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="max-w-2xl mx-auto flex">
          {(["fixture", "mundial", "leaderboard"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "text-white border-b-2 border-green-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t === "fixture" ? "Fixture" : t === "mundial" ? "Mundial" : "Ranking"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* FIXTURE TAB */}
        {tab === "fixture" && (
        <div className="flex flex-col gap-6">
            {matches.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-8">No hay partidos disponibles</p>
            )}
            {Object.entries(
            matches.reduce((acc, match) => {
                const day = new Date(match.utcDate).toLocaleDateString("es-AR", {
                weekday: "long", day: "numeric", month: "long",
                timeZone: "America/Argentina/Buenos_Aires",
                });
                if (!acc[day]) acc[day] = [];
                acc[day].push(match);
                return acc;
            }, {} as Record<string, typeof matches>)
            ).map(([day, dayMatches]) => (
            <div key={day}>
                {/* Encabezado del día */}
                <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-xs font-semibold text-zinc-400 capitalize">{day}</span>
                <div className="h-px flex-1 bg-zinc-800" />
                </div>

                {/* Partidos del día */}
                <div className="flex flex-col gap-3">
                {dayMatches.map(match => {
                    const locked = isLocked(match.utcDate);
                    const pred = predictions[match.id];
                    const draft = drafts[match.id];
                    const hasResult = match.score.fullTime.home !== null;

                    return (
                    <div key={match.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                        {/* Status + hora */}
                        <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-medium ${statusColor(match.status)}`}>
                            {statusLabel(match.status)}
                            {["LIVE", "IN_PLAY"].includes(match.status) && (
                            <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            )}
                        </span>
                        <span className="text-xs text-zinc-500">
                            {new Date(match.utcDate).toLocaleTimeString("es-AR", {
                            hour: "2-digit", minute: "2-digit",
                            timeZone: "America/Argentina/Buenos_Aires",
                            })}
                        </span>
                        </div>

                        {/* Equipos + marcador */}
                        <div className="flex items-center gap-3">
                        <div className="flex-1 text-right flex items-center justify-end gap-2">
                            {match.homeTeam.crest && (
                            <img src={match.homeTeam.crest} className="w-5 h-5 object-contain" alt="" />
                            )}
                            <span className="font-semibold text-sm">
                            {TEAM_NAMES_ES[match.homeTeam.name] ?? match.homeTeam.shortName}
                            </span>
                        </div>

                        <div className="flex items-center justify-center w-16">
                            {hasResult ? (
                            <span className="text-lg font-bold tabular-nums">
                                {match.score.fullTime.home} - {match.score.fullTime.away}
                            </span>
                            ) : (
                            <span className="text-zinc-600 text-sm font-mono">vs</span>
                            )}
                        </div>

                        <div className="flex-1 text-left flex items-center gap-2">
                            {match.awayTeam.crest && (
                            <img src={match.awayTeam.crest} className="w-5 h-5 object-contain" alt="" />
                            )}
                            <span className="font-semibold text-sm">
                            {TEAM_NAMES_ES[match.awayTeam.name] ?? match.awayTeam.shortName}
                            </span>
                        </div>
                        </div>

                        {/* Pronóstico */}
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                        {locked ? (
                            pred ? (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Tu pronóstico:</span>
                                <span className="font-mono text-zinc-300">
                                {pred.scoreHome} - {pred.scoreAway}
                                </span>
                                {pred.pointsEarned !== null && (
                                <span className={`font-bold ${pred.pointsEarned > 0 ? "text-green-400" : "text-zinc-500"}`}>
                                    +{pred.pointsEarned} pts
                                </span>
                                )}
                            </div>
                            ) : (
                            <p className="text-xs text-zinc-600 text-center">Sin pronóstico</p>
                            )
                        ) : (
                            <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 flex-1">Tu pronóstico:</span>
                            <input
                                type="number" min={0} max={20}
                                placeholder={pred ? String(pred.scoreHome) : "0"}
                                value={draft?.home ?? ""}
                                onChange={e => setDrafts(prev => ({
                                ...prev,
                                [match.id]: { home: e.target.value, away: prev[match.id]?.away ?? "" }
                                }))}
                                className="w-12 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-center text-white text-sm focus:outline-none focus:border-green-500"
                            />
                            <span className="text-zinc-600">-</span>
                            <input
                                type="number" min={0} max={20}
                                placeholder={pred ? String(pred.scoreAway) : "0"}
                                value={draft?.away ?? ""}
                                onChange={e => setDrafts(prev => ({
                                ...prev,
                                [match.id]: { home: prev[match.id]?.home ?? "", away: e.target.value }
                                }))}
                                className="w-12 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-center text-white text-sm focus:outline-none focus:border-green-500"
                            />
                            <button
                                onClick={() => savePrediction(match.id, match.utcDate)}
                                disabled={savingId === match.id}
                                className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                            >
                                {savingId === match.id ? "..." : pred ? "Editar" : "Guardar"}
                            </button>
                            </div>
                        )}
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
            ))}
        </div>
        )}

        {/* MUNDIAL TAB */}
        {tab === "mundial" && (
          <MundialTab />
        )}

        {/* LEADERBOARD TAB */}
        {tab === "leaderboard" && (
          <div className="flex flex-col gap-2">
            {members.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 bg-zinc-900 rounded-xl border px-4 py-3 ${
                  m.username === username ? "border-green-500/40" : "border-zinc-800"
                }`}
              >
                <span className={`text-sm font-bold w-6 text-center ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-600" : "text-zinc-600"
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium">
                  {m.username}
                  {m.username === username && <span className="text-green-400 text-xs ml-1">(vos)</span>}
                </span>
                <span className="text-green-400 font-bold text-sm">{m.totalPts} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function MundialTab() {
  const [scorers, setScorers] = useState<any[]>([]);
  const [view, setView] = useState<"grupos" | "goleadores">("grupos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/worldcup?type=scorers")
      .then(r => r.json())
      .then(sc => {
        setScorers(sc.scorers ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-zinc-500 text-sm text-center py-8">Cargando datos del mundial...</p>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("grupos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "grupos" ? "bg-green-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
        >
          Grupos
        </button>
        <button
          onClick={() => setView("goleadores")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "goleadores" ? "bg-green-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
        >
          Goleadores
        </button>
      </div>

      {view === "grupos" && (
        <div className="flex flex-col gap-4">
          {Object.entries(GRUPOS_WC2026).map(([letra, equipos]) => (
            <div key={letra} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300">Grupo {letra}</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left px-4 py-1.5 font-medium">Equipo</th>
                    <th className="px-2 py-1.5 font-medium">PJ</th>
                    <th className="px-2 py-1.5 font-medium">G</th>
                    <th className="px-2 py-1.5 font-medium">E</th>
                    <th className="px-2 py-1.5 font-medium">P</th>
                    <th className="px-2 py-1.5 font-medium">DG</th>
                    <th className="px-2 py-1.5 font-medium font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {equipos.map((eq, i) => (
                    <tr key={eq.tla} className={`border-b border-zinc-800/50 ${i < 2 ? "text-white" : "text-zinc-400"}`}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <img src={eq.crest} className="w-4 h-4 object-contain" alt="" />
                          {eq.name}
                        </div>
                      </td>
                      <td className="text-center px-2 py-2">0</td>
                      <td className="text-center px-2 py-2">0</td>
                      <td className="text-center px-2 py-2">0</td>
                      <td className="text-center px-2 py-2">0</td>
                      <td className="text-center px-2 py-2">0</td>
                      <td className="text-center px-2 py-2 font-bold text-green-400">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {view === "goleadores" && (
        <div className="flex flex-col gap-2">
          {scorers.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-8">Aún no hay goleadores registrados</p>
          )}
          {scorers.map((s: any, i: number) => (
            <div key={s.player.id} className="flex items-center gap-3 bg-zinc-900 rounded-xl border border-zinc-800 px-4 py-3">
              <span className="text-zinc-600 text-sm font-bold w-5">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{s.player.name}</p>
                <p className="text-xs text-zinc-500">{TEAM_NAMES_ES[s.team.name] ?? s.team.shortName ?? s.team.name}</p>
              </div>
              <span className="text-green-400 font-bold text-sm">{s.goals} goles</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}