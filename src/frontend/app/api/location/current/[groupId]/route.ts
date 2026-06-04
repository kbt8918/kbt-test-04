// API-012 현재 위치 조회 — GET /api/location/current/:groupId (해당 그룹 구성원)
import { NextRequest } from "next/server";
import { handler, ok, fail, requireAuth } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { assertMember, findGroupParent } from "@/lib/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest, { params }) => {
  const auth = requireAuth(req);
  const groupId = params.groupId;
  const db = createAdminClient();

  await assertMember(db, groupId, auth.userId);

  const parent = await findGroupParent(db, groupId);
  if (!parent) return fail("NOT_FOUND", "그룹에 부모님 사용자가 없습니다.");
  if (!parent.location_sharing) return fail("NOT_FOUND", "위치 공유가 꺼져 있습니다.");

  const { data: loc } = await db
    .from("locations")
    .select("latitude, longitude, accuracy, measured_at")
    .eq("group_id", groupId)
    .eq("user_id", parent.id)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!loc) return fail("NOT_FOUND", "위치 데이터가 없습니다.");

  return ok({
    userId: parent.id,
    latitude: Number(loc.latitude),
    longitude: Number(loc.longitude),
    accuracy: Number(loc.accuracy),
    locationSharing: parent.location_sharing,
    timestamp: loc.measured_at,
  });
});
