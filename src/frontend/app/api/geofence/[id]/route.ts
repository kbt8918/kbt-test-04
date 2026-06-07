// API-020 안전구역 수정(PUT) / API-021 삭제(DELETE) — :id = geofence UUID (role: family)
// API-022 목록 조회(GET) — :id = groupId (해당 그룹 구성원)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireAuth, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import type { Database } from "@/lib/db.types";
import { assertMember } from "@/lib/groups";
import { isValidGroupName } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** API-022: GET /api/geofence/:groupId — 그룹 안전 구역 목록 */
export const GET = handler(async (req: NextRequest, { params }) => {
  const auth = requireAuth(req);
  const groupId = params.id;
  const db = createAdminClient();
  await assertMember(db, groupId, auth.userId);

  const { data, error } = await db
    .from("geofences")
    .select("id, name, latitude, longitude, radius, created_at")
    .eq("group_id", groupId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  return ok({
    geofences: (data ?? []).map((g) => ({
      geofenceId: g.id,
      name: g.name,
      latitude: Number(g.latitude),
      longitude: Number(g.longitude),
      radius: g.radius,
      createdAt: g.created_at,
    })),
  });
});

interface PutBody {
  name?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

/** API-020: PUT /api/geofence/:id — 안전 구역 수정 */
export const PUT = handler(async (req: NextRequest, { params }) => {
  const auth = requireRole(req, "family");
  const geofenceId = params.id;
  const body = await readJson<PutBody>(req);

  const db = createAdminClient();
  const { data: geo } = await db
    .from("geofences")
    .select("id, group_id")
    .eq("id", geofenceId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!geo) return fail("NOT_FOUND", "존재하지 않는 안전 구역입니다.");
  await assertMember(db, geo.group_id, auth.userId);

  const patch: Database["public"]["Tables"]["geofences"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (body.name !== undefined) {
    if (!isValidGroupName(body.name)) return fail("BAD_REQUEST", "구역명은 1~20자여야 합니다.");
    patch.name = body.name;
  }
  if (body.latitude !== undefined) patch.latitude = body.latitude;
  if (body.longitude !== undefined) patch.longitude = body.longitude;
  if (body.radius !== undefined) {
    if (body.radius < 100 || body.radius > 5000)
      return fail("BAD_REQUEST", "반경은 100~5000m 여야 합니다.");
    patch.radius = body.radius;
  }

  const { data: updated, error } = await db
    .from("geofences")
    .update(patch)
    .eq("id", geofenceId)
    .select("id, name, latitude, longitude, radius, updated_at")
    .single();
  if (error || !updated) throw new ApiError("INTERNAL_ERROR", error?.message ?? "수정 실패");

  return ok({
    geofenceId: updated.id,
    name: updated.name,
    latitude: Number(updated.latitude),
    longitude: Number(updated.longitude),
    radius: updated.radius,
    updatedAt: updated.updated_at,
  });
});

/** API-021: DELETE /api/geofence/:id — 안전 구역 삭제(소프트) */
export const DELETE = handler(async (req: NextRequest, { params }) => {
  const auth = requireRole(req, "family");
  const geofenceId = params.id;

  const db = createAdminClient();
  const { data: geo } = await db
    .from("geofences")
    .select("id, group_id")
    .eq("id", geofenceId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!geo) return fail("NOT_FOUND", "존재하지 않는 안전 구역입니다.");
  await assertMember(db, geo.group_id, auth.userId);

  const deletedAt = new Date().toISOString();
  const { error } = await db.from("geofences").update({ deleted_at: deletedAt }).eq("id", geofenceId);
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  return ok({ deletedAt });
});
