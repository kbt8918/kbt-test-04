// API-011 위치 공유 ON/OFF — PATCH /api/users/me/location-sharing (role: parent)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireRole } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { findMembership, groupMemberIds } from "@/lib/groups";
import { sendPushToUsers } from "@/lib/notify";

export const runtime = "nodejs";

interface Body {
  locationSharing?: boolean;
}

export const PATCH = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "parent");
  const body = await readJson<Body>(req);
  if (typeof body.locationSharing !== "boolean")
    return fail("BAD_REQUEST", "locationSharing(boolean) 값이 필요합니다.");

  const db = createAdminClient();
  const { data: user } = await db
    .from("users")
    .select("location_consent_at")
    .eq("id", auth.userId)
    .maybeSingle();

  if (body.locationSharing && !user?.location_consent_at)
    return fail("UNPROCESSABLE", "위치정보 동의가 철회된 상태에서는 켤 수 없습니다.");

  const updatedAt = new Date().toISOString();
  await db.from("users").update({ location_sharing: body.locationSharing }).eq("id", auth.userId);

  let notified = 0;
  const membership = await findMembership(db, auth.userId);
  if (membership) {
    const memberIds = await groupMemberIds(db, membership.group_id, auth.userId);
    const res = await sendPushToUsers(db, memberIds, {
      title: body.locationSharing ? "위치 공유 켜짐" : "위치 공유 꺼짐",
      body: body.locationSharing
        ? "부모님이 위치 공유를 다시 켜셨습니다."
        : "부모님이 위치 공유를 끄셨습니다.",
      data: { type: "location_sharing", on: String(body.locationSharing) },
    });
    notified = res.notified;
  }

  return ok({ locationSharing: body.locationSharing, updatedAt, notifiedMembers: notified });
});
