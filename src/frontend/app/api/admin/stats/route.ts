// API-028 통계 조회 — GET /api/admin/stats?type&period&from&to (role: admin)
import { NextRequest } from "next/server";
import { handler, ok, fail, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPE = ["dau", "groups", "sos", "all"];
const VALID_PERIOD = ["day", "week", "month"];

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const GET = handler(async (req: NextRequest) => {
  requireRole(req, "admin");
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "all";
  const period = url.searchParams.get("period") ?? "day";
  if (!VALID_TYPE.includes(type)) return fail("BAD_REQUEST", "type 값이 올바르지 않습니다.");
  if (!VALID_PERIOD.includes(period)) return fail("BAD_REQUEST", "period 값이 올바르지 않습니다.");

  const today = new Date();
  const to = url.searchParams.get("to") ?? dateOnly(today);
  const fromDefault = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = url.searchParams.get("from") ?? dateOnly(fromDefault);

  const db = createAdminClient();
  const fromIso = new Date(`${from}T00:00:00Z`).toISOString();
  const toIso = new Date(`${to}T23:59:59Z`).toISOString();

  // 요약: 그룹 수, SOS 건수, DAU(last_seen 기준 활성 사용자)
  const { count: totalGroups } = await db
    .from("groups")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  const { count: totalSos } = await db
    .from("sos_events")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", fromIso)
    .lte("sent_at", toIso);
  const { count: totalDau } = await db
    .from("users")
    .select("id", { count: "exact", head: true })
    .gte("last_seen_at", fromIso)
    .lte("last_seen_at", toIso)
    .is("deleted_at", null);

  // 시계열: 기간 내 일별 신규 그룹/SOS 집계 (DAU는 활성 추정치)
  const { data: groupRows } = await db
    .from("groups")
    .select("created_at")
    .gte("created_at", fromIso)
    .lte("created_at", toIso);
  const { data: sosRows } = await db
    .from("sos_events")
    .select("sent_at")
    .gte("sent_at", fromIso)
    .lte("sent_at", toIso);

  const byDate: Record<string, { newGroups: number; sosEvents: number }> = {};
  for (const g of groupRows ?? []) {
    const d = g.created_at.slice(0, 10);
    (byDate[d] ??= { newGroups: 0, sosEvents: 0 }).newGroups += 1;
  }
  for (const s of sosRows ?? []) {
    const d = s.sent_at.slice(0, 10);
    (byDate[d] ??= { newGroups: 0, sosEvents: 0 }).sosEvents += 1;
  }
  const series = Object.keys(byDate)
    .sort()
    .map((date) => ({ date, dau: 0, newGroups: byDate[date].newGroups, sosEvents: byDate[date].sosEvents }));

  return ok({
    period,
    from,
    to,
    summary: {
      totalDau: totalDau ?? 0,
      totalGroups: totalGroups ?? 0,
      totalSosEvents: totalSos ?? 0,
    },
    series,
  });
});
