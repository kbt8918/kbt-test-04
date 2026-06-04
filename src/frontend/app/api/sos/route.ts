// API-015 SOS 알림 발송 — POST /api/sos (role: parent)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { findMembership, groupMemberIds } from "@/lib/groups";
import { sendPushToUsers } from "@/lib/notify";

export const runtime = "nodejs";

interface Body {
  latitude?: number;
  longitude?: number;
}

export const POST = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "parent");
  const body = await readJson<Body>(req).catch(() => ({} as Body));

  const db = createAdminClient();
  const membership = await findMembership(db, auth.userId);
  if (!membership) return fail("UNPROCESSABLE", "소속된 그룹이 없습니다.");

  const lat = typeof body.latitude === "number" ? body.latitude : null;
  const lng = typeof body.longitude === "number" ? body.longitude : null;

  const memberIds = await groupMemberIds(db, membership.group_id, auth.userId);
  const push = await sendPushToUsers(db, memberIds, {
    title: "🚨 SOS 긴급 상황 발생",
    body: "부모님이 도움을 요청하셨습니다. 즉시 확인해 주세요.",
    data: {
      type: "sos",
      lat: lat !== null ? String(lat) : "",
      lng: lng !== null ? String(lng) : "",
    },
  });

  const { data: ev, error } = await db
    .from("sos_events")
    .insert({
      group_id: membership.group_id,
      sender_id: auth.userId,
      latitude: lat,
      longitude: lng,
      notified_count: push.notified,
      failed_count: push.failed,
    })
    .select("id, sent_at")
    .single();
  if (error || !ev) throw new ApiError("INTERNAL_ERROR", error?.message ?? "SOS 기록 실패");

  return ok(
    {
      sosEventId: ev.id,
      sentAt: ev.sent_at,
      notifiedCount: push.notified,
      failedCount: push.failed,
    },
    201
  );
});
