// API-013 위치 이력 조회 — GET /api/location/history?groupId&date (role: family)
import { NextRequest } from "next/server";
import { handler, ok, fail, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { assertMember } from "@/lib/groups";
import { LOCATION_RETENTION_DAYS } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_THRESHOLD = 100;
const SAMPLE_INTERVAL_MS = 10 * 60 * 1000; // 10분

export const GET = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "family");
  const url = new URL(req.url);
  const groupId = url.searchParams.get("groupId");
  const date = url.searchParams.get("date");

  if (!groupId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return fail("BAD_REQUEST", "groupId 와 date(YYYY-MM-DD)가 필요합니다.");

  // 7일 초과 조회 차단
  const dayStart = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(dayStart.getTime())) return fail("BAD_REQUEST", "날짜 형식이 올바르지 않습니다.");
  const ageDays = (Date.now() - dayStart.getTime()) / (24 * 60 * 60 * 1000);
  if (ageDays > LOCATION_RETENTION_DAYS)
    return fail("UNPROCESSABLE", `위치 이력은 최대 ${LOCATION_RETENTION_DAYS}일까지만 조회할 수 있습니다.`);

  const db = createAdminClient();
  await assertMember(db, groupId, auth.userId);

  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const { data: rows, error } = await db
    .from("locations")
    .select("id, latitude, longitude, accuracy, measured_at")
    .eq("group_id", groupId)
    .gte("measured_at", dayStart.toISOString())
    .lt("measured_at", dayEnd.toISOString())
    .order("measured_at", { ascending: true });
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  const all = rows ?? [];
  let sampled = false;
  let points = all;
  if (all.length > SAMPLE_THRESHOLD) {
    sampled = true;
    points = [];
    let lastMs = -Infinity;
    for (const r of all) {
      const ms = new Date(r.measured_at).getTime();
      if (ms - lastMs >= SAMPLE_INTERVAL_MS) {
        points.push(r);
        lastMs = ms;
      }
    }
  }

  return ok({
    date,
    totalPoints: points.length,
    sampled,
    locations: points.map((r) => ({
      locationId: r.id,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      accuracy: Number(r.accuracy),
      timestamp: r.measured_at,
    })),
  });
});
