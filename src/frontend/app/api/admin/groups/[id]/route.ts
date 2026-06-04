// API-024 관리자 그룹 상세 — GET /api/admin/groups/:id (role: admin)
import { NextRequest } from "next/server";
import { handler, ok, fail, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest, { params }) => {
  requireRole(req, "admin");
  const groupId = params.id;
  const db = createAdminClient();

  const { data: group } = await db
    .from("groups")
    .select("id, name, created_at")
    .eq("id", groupId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!group) return fail("NOT_FOUND", "존재하지 않는 그룹입니다.");

  const { data: members, error } = await db
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: users, error: uErr } = userIds.length
    ? await db
        .from("users")
        .select("id, phone, role, location_sharing, last_seen_at")
        .in("id", userIds)
    : { data: [], error: null };
  if (uErr) throw new ApiError("INTERNAL_ERROR", uErr.message);

  return ok({
    groupId: group.id,
    groupName: group.name,
    createdAt: group.created_at,
    members: (users ?? []).map((u) => ({
      userId: u.id,
      phone: u.phone,
      role: u.role,
      locationSharing: u.location_sharing,
      lastSeenAt: u.last_seen_at,
    })),
  });
});
