"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setError("");
    if (!roomName.trim() || !username.trim()) {
      setError("Completá todos los campos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("sessionToken", data.sessionToken);
      localStorage.setItem("username", data.participant.username);
      router.push(`/sala/${data.room.code}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setError("");
    if (!code.trim() || !username.trim()) {
      setError("Completá todos los campos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("sessionToken", data.sessionToken);
      localStorage.setItem("username", data.participant.username);
      router.push(`/sala/${data.room.code}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Fixture Mundial 2026
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Pronosticá los partidos y competí con tus amigos
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => { setTab("create"); setError(""); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === "create"
                  ? "text-white border-b-2 border-green-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Crear sala
            </button>
            <button
              onClick={() => { setTab("join"); setError(""); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === "join"
                  ? "text-white border-b-2 border-green-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Unirse a sala
            </button>
          </div>

          {/* Form */}
          <div className="p-6 flex flex-col gap-4">
            {tab === "create" ? (
              <>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Nombre de la sala</label>
                  <input
                    type="text"
                    placeholder="Ej: Los pibes del trabajo"
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Tu nombre</label>
                  <input
                    type="text"
                    placeholder="¿Cómo te llaman?"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
                >
                  {loading ? "Creando..." : "Crear sala"}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Código de sala</label>
                  <input
                    type="text"
                    placeholder="Ej: ABC123"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-green-500 transition-colors font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Tu nombre</label>
                  <input
                    type="text"
                    placeholder="¿Cómo te llaman?"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleJoin()}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
                >
                  {loading ? "Uniéndome..." : "Unirse"}
                </button>
              </>
            )}

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Mundial 2026 · USA · México · Canadá
        </p>
      </div>
    </main>
  );
}