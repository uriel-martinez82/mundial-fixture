import { NextRequest, NextResponse } from "next/server";
import { footballApi } from "@/lib/football";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "matches";

  try {
    let data;
    if (type === "standings") data = await footballApi.standings();
    else if (type === "scorers") data = await footballApi.scorers();
    else data = await footballApi.matches();

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Error al obtener datos del mundial" }, { status: 502 });
  }
}