// API-007 그룹 정보 조회 — GET /api/groups/:id (해당 그룹 구성원)
import { NextRequest } from "next/server";
import { handler, ok, fail, requireAuth, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { assertMember } from "@/lib/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest, { params }) => {
  const auth = requireAuth(req);
  const groupId = params.id;
  const db = createAdminClient();

  const { data: group } = await db
    .from("groups")
    .select("id, name, invite_code, created_at")
    .eq("id", groupId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!group) return fail("NOT_FOUND", "존재하지 않는 그룹입니다.");

  await assertMember(db, groupId, auth.userId);

  const { data: members, error } = await db
    .from("group_members")
    .select("user_id, relation")
    .eq("group_id", groupId);
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  // user_id -> relation(호칭) 매핑
  const relationByUser = new Map<string, string | null>(
    (members ?? []).map((m) => [m.user_id, m.relation])
  );

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: users, error: uErr } = userIds.length
    ? await db
        .from("users")
        .select("id, name, role, location_sharing, last_seen_at")
        .in("id", userIds)
    : { data: [], error: null };
  if (uErr) throw new ApiError("INTERNAL_ERROR", uErr.message);

  const memberList = (users ?? []).map((u) => ({
    userId: u.id,
    name: u.name,
    role: u.role,
    relation: relationByUser.get(u.id) ?? null,
    isParent: u.role === "parent",
    locationSharing: u.location_sharing,
    lastSeenAt: u.last_seen_at,
  }));

  return ok({
    groupId: group.id,
    groupName: group.name,
    inviteCode: group.invite_code,
    memberCount: memberList.length,
    members: memberList,
    createdAt: group.created_at,
  });
});
