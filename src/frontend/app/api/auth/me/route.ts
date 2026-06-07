// API-004 내 정보 조회 — GET /api/auth/me
import { NextRequest } from "next/server";
import { handler, ok, fail, requireAuth, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { findMembership } from "@/lib/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  const db = createAdminClient();

  const { data: user, error } = await db
    .from("users")
    .select("id, phone, role, location_sharing, location_consent_at, location_interval, created_at")
    .eq("id", auth.userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);
  if (!user) return fail("UNAUTHORIZED", "사용자를 찾을 수 없습니다.");

  const membership = await findMembership(db, user.id);
  let groupName: string | null = null;
  if (membership) {
    const { data: g } = await db
      .from("groups")
      .select("name")
      .eq("id", membership.group_id)
      .maybeSingle();
    groupName = g?.name ?? null;
  }

  return ok({
    userId: user.id,
    phone: user.phone,
    role: user.role,
    locationSharing: user.location_sharing,
    locationConsentAt: user.location_consent_at,
    locationInterval: user.location_interval,
    groupId: membership?.group_id ?? null,
    groupName,
    createdAt: user.created_at,
  });
});
