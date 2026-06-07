// API-019 안전 구역 생성 — POST /api/geofence (role: family)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { assertMember } from "@/lib/groups";
import { isValidGroupName } from "@/lib/validation";

export const runtime = "nodejs";

interface Body {
  groupId?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

// 플랜별 안전 구역 한도 (서비스기획서 6.2 — Free 1개 / Pro 2개)
const PLAN_LIMIT: Record<string, number> = { free: 1, pro: 2 };

export const POST = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "family");
  const body = await readJson<Body>(req);
  const { groupId, name, latitude, longitude, radius } = body;

  if (!groupId || !name || !isValidGroupName(name))
    return fail("BAD_REQUEST", "groupId 와 구역명(1~20자)이 필요합니다.");
  if (typeof latitude !== "number" || typeof longitude !== "number")
    return fail("BAD_REQUEST", "중심점 좌표가 필요합니다.");
  if (typeof radius !== "number" || radius < 100 || radius > 5000)
    return fail("BAD_REQUEST", "반경은 100~5000m 여야 합니다.");

  const db = createAdminClient();
  await assertMember(db, groupId, auth.userId);

  const { data: group } = await db.from("groups").select("plan").eq("id", groupId).maybeSingle();
  const limit = PLAN_LIMIT[group?.plan ?? "free"] ?? 1;
  const { count } = await db
    .from("geofences")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .is("deleted_at", null);
  if ((count ?? 0) >= limit)
    return fail("UNPROCESSABLE", `현재 플랜에서는 안전 구역을 최대 ${limit}개까지 등록할 수 있습니다.`);

  const { data: geo, error } = await db
    .from("geofences")
    .insert({ group_id: groupId, name, latitude, longitude, radius })
    .select("id, name, latitude, longitude, radius, created_at")
    .single();
  if (error || !geo) throw new ApiError("INTERNAL_ERROR", error?.message ?? "안전 구역 생성 실패");

  return ok(
    {
      geofenceId: geo.id,
      name: geo.name,
      latitude: Number(geo.latitude),
      longitude: Number(geo.longitude),
      radius: geo.radius,
      createdAt: geo.created_at,
    },
    201
  );
});
