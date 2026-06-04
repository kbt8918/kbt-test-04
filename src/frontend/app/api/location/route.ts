// API-010 위치 데이터 전송 — POST /api/location (role: parent)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { findMembership } from "@/lib/groups";
import { GPS_ACCURACY_THRESHOLD } from "@/lib/validation";

export const runtime = "nodejs";

interface Body {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: string;
}

export const POST = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "parent");
  const body = await readJson<Body>(req);
  const { latitude, longitude, accuracy, timestamp } = body;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof accuracy !== "number" ||
    !timestamp ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  )
    return fail("BAD_REQUEST", "위치 데이터 형식이 올바르지 않습니다.");

  const db = createAdminClient();

  const { data: user } = await db
    .from("users")
    .select("location_consent_at, location_sharing")
    .eq("id", auth.userId)
    .maybeSingle();
  if (!user?.location_consent_at)
    return fail("FORBIDDEN", "위치정보 수집에 동의하지 않았습니다.");

  if (accuracy > GPS_ACCURACY_THRESHOLD)
    return fail("UNPROCESSABLE", `GPS 정확도가 낮아(${accuracy}m) 저장에서 제외됩니다.`);

  const membership = await findMembership(db, auth.userId);
  if (!membership) return fail("UNPROCESSABLE", "소속된 그룹이 없습니다.");

  const { data: loc, error } = await db
    .from("locations")
    .insert({
      user_id: auth.userId,
      group_id: membership.group_id,
      latitude,
      longitude,
      accuracy,
      measured_at: timestamp,
    })
    .select("id, created_at")
    .single();
  if (error || !loc) throw new ApiError("INTERNAL_ERROR", error?.message ?? "위치 저장 실패");

  await db
    .from("users")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", auth.userId);
  await db
    .from("groups")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", membership.group_id);

  return ok({ locationId: loc.id, savedAt: loc.created_at }, 201);
});
