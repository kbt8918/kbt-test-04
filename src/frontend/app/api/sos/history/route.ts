// API-016 SOS 수신 이력 조회 — GET /api/sos/history?groupId&limit (해당 그룹 구성원)
import { NextRequest } from "next/server";
import { handler, ok, fail, requireAuth, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { assertMember } from "@/lib/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  const url = new URL(req.url);
  const groupId = url.searchParams.get("groupId");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 100);
  if (!groupId) return fail("BAD_REQUEST", "groupId 가 필요합니다.");

  const db = createAdminClient();
  await assertMember(db, groupId, auth.userId);

  const { data, error, count } = await db
    .from("sos_events")
    .select("id, latitude, longitude, sent_at, notified_count", { count: "exact" })
    .eq("group_id", groupId)
    .order("sent_at", { ascending: false })
    .limit(limit);
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  return ok({
    total: count ?? (data?.length ?? 0),
    events: (data ?? []).map((e) => ({
      sosEventId: e.id,
      latitude: e.latitude !== null ? Number(e.latitude) : null,
      longitude: e.longitude !== null ? Number(e.longitude) : null,
      sentAt: e.sent_at,
      notifiedCount: e.notified_count,
    })),
  });
});
