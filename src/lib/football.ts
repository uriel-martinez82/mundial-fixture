const BASE = process.env.FOOTBALL_API_URL!;
const KEY  = process.env.FOOTBALL_API_KEY!;

async function apiFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": KEY },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`football-data error: ${res.status}`);
  return res.json();
}

export const footballApi = {
  matches:   () => apiFetch("/competitions/WC/matches?season=2026"),
  standings: () => apiFetch("/competitions/WC/standings?season=2026"),
  scorers:   () => apiFetch("/competitions/WC/scorers?season=2026&limit=10"),
  match:     (id: number) => apiFetch(`/matches/${id}`),
};