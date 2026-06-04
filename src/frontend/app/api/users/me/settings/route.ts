// API-029 사용자 설정 저장 — PATCH /api/users/me/settings (role: parent)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import type { Database } from "@/lib/db.types";
import { LOCATION_INTERVAL_NORMAL, LOCATION_INTERVAL_SAVING } from "@/lib/validation";

export const runtime = "nodejs";

interface Body {
  locationInterval?: number;
}

export const PATCH = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "parent");
  const body = await readJson<Body>(req);

  if (
    body.locationInterval !== undefined &&
    body.locationInterval !== LOCATION_INTERVAL_NORMAL &&
    body.locationInterval !== LOCATION_INTERVAL_SAVING
  )
    return fail("BAD_REQUEST", `위치 전송 주기는 ${LOCATION_INTERVAL_NORMAL} 또는 ${LOCATION_INTERVAL_SAVING}초여야 합니다.`);

  const db = createAdminClient();
  const updatedAt = new Date().toISOString();
  const patch: Database["public"]["Tables"]["users"]["Update"] = { updated_at: updatedAt };
  if (body.locationInterval !== undefined) patch.location_interval = body.locationInterval;

  const { data, error } = await db
    .from("users")
    .update(patch)
    .eq("id", auth.userId)
    .select("location_interval")
    .single();
  if (error || !data) throw new ApiError("INTERNAL_ERROR", error?.message ?? "설정 저장 실패");

  return ok({ locationInterval: data.location_interval, updatedAt });
});
