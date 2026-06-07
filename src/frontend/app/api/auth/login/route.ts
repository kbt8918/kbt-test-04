// API-002 로그인 — POST /api/auth/login
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { normalizePhone } from "@/lib/validation";
import { signToken, buildAuthCookie } from "@/lib/jwt";
import { findMembership } from "@/lib/groups";

export const runtime = "nodejs";

interface Body {
  phone?: string;
}

export const POST = handler(async (req: NextRequest) => {
  const body = await readJson<Body>(req);
  const phone = normalizePhone(body.phone ?? "");
  if (!phone) return fail("BAD_REQUEST", "휴대폰 번호 형식이 올바르지 않습니다.");

  const db = createAdminClient();
  const { data: user } = await db
    .from("users")
    .select("id, phone, role, location_sharing")
    .eq("phone", phone)
    .is("deleted_at", null)
    .maybeSingle();
  if (!user) return fail("NOT_FOUND", "등록되지 않은 번호입니다.");

  const membership = await findMembership(db, user.id);
  await db.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);

  const token = signToken({ userId: user.id, role: user.role, phone: user.phone });
  return ok(
    {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      locationSharing: user.location_sharing,
      groupId: membership?.group_id ?? null,
    },
    200,
    { "Set-Cookie": buildAuthCookie(token) }
  );
});
