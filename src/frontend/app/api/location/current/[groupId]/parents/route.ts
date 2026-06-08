// API-012b 부모님 전체 현재 위치 조회 — GET /api/location/current/:groupId/parents
// 플랜별 한도(Free 2명 / Pro 무제한) 안에서 그룹 내 부모님들의 최신 위치를 반환한다.
import { NextRequest } from "next/server";
import { handler, ok, requireAuth } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { assertMember, findGroupParents } from "@/lib/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 플랜별 위치 확인 가능 부모님 수 (Free 2명 / Pro 무제한). null = 무제한
const PLAN_PARENT_LIMIT: Record<string, number | null> = { free: 2, pro: null };

export const GET = handler(async (req: NextRequest, { params }) => {
  const auth = requireAuth(req);
  const groupId = params.groupId;
  const db = createAdminClient();

  await assertMember(db, groupId, auth.userId);

  const { data: group } = await db.from("groups").select("plan").eq("id", groupId).maybeSingle();
  const plan = group?.plan ?? "free";
  const limit = plan in PLAN_PARENT_LIMIT ? PLAN_PARENT_LIMIT[plan] : 2;

  const parents = await findGroupParents(db, groupId);
  const totalParents = parents.length;
  // 한도가 있으면 그만큼만 위치를 노출(나머지는 업그레이드 유도)
  const visible = limit == null ? parents : parents.slice(0, limit);

  const result = await Promise.all(
    visible.map(async (p) => {
      let loc: { latitude: number; longitude: number; accuracy: number; measured_at: string } | null = null;
      if (p.location_sharing) {
        const { data } = await db
          .from("locations")
          .select("latitude, longitude, accuracy, measured_at")
          .eq("group_id", groupId)
          .eq("user_id", p.id)
          .order("measured_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        loc = data ?? null;
      }
      return {
        userId: p.id,
        name: p.name,
        relation: p.relation,
        locationSharing: p.location_sharing,
        latitude: loc ? Number(loc.latitude) : null,
        longitude: loc ? Number(loc.longitude) : null,
        accuracy: loc ? Number(loc.accuracy) : null,
        timestamp: loc ? loc.measured_at : null,
      };
    })
  );

  return ok({
    plan,
    planLimit: limit, // null = 무제한(Pro)
    totalParents,
    visibleCount: result.length,
    parents: result,
  });
});
