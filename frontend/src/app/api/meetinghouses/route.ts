import type { NextRequest } from "next/server";
import {
  fetchArgentinaMeetinghouses,
  fetchNearbyMeetinghouses,
} from "../../../services/meetinghouseService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const scope = searchParams.get("scope");
  const lat = Number(searchParams.get("lat") ?? "-34.6037");
  const lng = Number(searchParams.get("lng") ?? "-58.3816");
  const radius = Number(searchParams.get("radius") ?? "15");

  if (
    scope !== "argentina" &&
    (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius))
  ) {
    return Response.json(
      { error: "Los parametros lat, lng y radius deben ser numericos." },
      { status: 400 },
    );
  }

  try {
    const meetinghouses =
      scope === "argentina"
        ? await fetchArgentinaMeetinghouses()
        : await fetchNearbyMeetinghouses(lat, lng, radius);
    const visibleMeetinghouses = meetinghouses.filter(
      (item) =>
        item.coordinates.lat !== null &&
        item.coordinates.lng !== null &&
        Number.isFinite(item.coordinates.lat) &&
        Number.isFinite(item.coordinates.lng),
    );

    return Response.json(visibleMeetinghouses);
  } catch (error) {
    console.error("Error obteniendo capillas:", error);
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron obtener capillas en este momento.";

    return Response.json(
      {
        error: "No se pudieron obtener capillas en este momento.",
        details: message,
      },
      { status: 502 },
    );
  }
}
