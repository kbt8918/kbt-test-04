// API-008 위치정보 동의 저장 (POST) / API-009 동의 철회 (DELETE)
// URL: /api/location/consent (role: parent)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { findMembership, groupMemberIds } from "@/lib/groups";
import { sendPushToUsers } from "@/lib/notify";

export const runtime = "nodejs";

interface ConsentBody {
  locationConsentRequired?: boolean;
  marketingConsent?: boolean;
  consentVersion?: string;
}

export const POST = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "parent");
  const body = await readJson<ConsentBody>(req);
  if (body.locationConsentRequired !== true)
    return fail("BAD_REQUEST", "위치정보 수집·이용 필수 동의가 필요합니다.");
  if (!body.consentVersion) return fail("BAD_REQUEST", "동의 약관 버전이 필요합니다.");

  const db = createAdminClient();
  const now = new Date().toISOString();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const { data: consent, error } = await db
    .from("location_consents")
    .insert({
      user_id: auth.userId,
      action: "grant",
      location_consent_required: true,
      marketing_consent: body.marketingConsent ?? false,
      consent_version: body.consentVersion,
      ip_address: ip,
    })
    .select("id, created_at")
    .single();
  if (error || !consent) throw new ApiError("INTERNAL_ERROR", error?.message ?? "동의 저장 실패");

  await db
    .from("users")
    .update({ location_consent_at: now, location_sharing: true })
    .eq("id", auth.userId);

  return ok({
    consentId: consent.id,
    locationConsentAt: consent.created_at,
    marketingConsent: body.marketingConsent ?? false,
    consentVersion: body.consentVersion,
  });
});

export const DELETE = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "parent");
  const db = createAdminClient();

  const { data: last } = await db
    .from("location_consents")
    .select("id")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last) return fail("NOT_FOUND", "동의 이력이 없습니다.");

  const revokedAt = new Date().toISOString();
  await db.from("location_consents").insert({
    user_id: auth.userId,
    action: "revoke",
    location_consent_required: false,
    consent_version: "revoke",
  });
  await db
    .from("users")
    .update({ location_sharing: false, location_consent_at: null })
    .eq("id", auth.userId);

  // 가족에게 철회 알림
  let notified = 0;
  const membership = await findMembership(db, auth.userId);
  if (membership) {
    const memberIds = await groupMemberIds(db, membership.group_id, auth.userId);
    const res = await sendPushToUsers(db, memberIds, {
      title: "위치 공유 동의 철회",
      body: "부모님이 위치 정보 제공 동의를 철회하셨습니다.",
      data: { type: "consent_revoked" },
    });
    notified = res.notified;
  }

  return ok({ revokedAt, notifiedMembers: notified });
});
