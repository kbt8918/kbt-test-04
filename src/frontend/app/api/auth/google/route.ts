// API-031 Google OAuth 로그인/가입 — POST /api/auth/google
// 회원가입 탭에서 연동한 Google 계정으로 로그인하거나, 미가입 시 자동 가입한다.
import { NextRequest } from "next/server";
import { handler, ok, fail, ApiError, readJson } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { signToken, buildAuthCookie } from "@/lib/jwt";
import { findMembership } from "@/lib/groups";

export const runtime = "nodejs";

interface Body {
  accessToken?: string;
  email?: string;
  name?: string;
  picture?: string;
}

// accessToken 으로 Google 사용자 정보 검증 (이메일 위조 방지)
async function fetchGoogleUserInfo(accessToken: string): Promise<{ email?: string; name?: string; picture?: string } | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as { email?: string; name?: string; picture?: string };
  } catch {
    return null;
  }
}

export const POST = handler(async (req: NextRequest) => {
  const body = await readJson<Body>(req);

  // accessToken 이 있으면 Google 서버로 재검증하여 이메일 신뢰성 확보
  let email = body.email;
  let name = body.name;
  let picture = body.picture;
  if (body.accessToken) {
    const verified = await fetchGoogleUserInfo(body.accessToken);
    if (verified?.email) {
      email = verified.email;
      name = verified.name ?? name;
      picture = verified.picture ?? picture;
    }
  }

  if (!email) return fail("BAD_REQUEST", "Google 계정 이메일을 확인할 수 없습니다.");

  const db = createAdminClient();

  // 기존 사용자 조회 (google_email 기준)
  const { data: existing, error: selErr } = await db
    .from("users")
    .select("id, phone, role, location_sharing")
    .eq("google_email", email)
    .is("deleted_at", null)
    .maybeSingle();
  if (selErr) throw new ApiError("INTERNAL_ERROR", selErr.message);

  if (existing) {
    // 기존 사용자: 로그인 처리
    await db.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", existing.id);
    const membership = await findMembership(db, existing.id);
    const token = signToken({ userId: existing.id, role: existing.role, phone: existing.phone ?? "" });
    return ok(
      {
        userId: existing.id,
        phone: existing.phone,
        role: existing.role,
        locationSharing: existing.location_sharing,
        groupId: membership?.group_id ?? null,
      },
      200,
      { "Set-Cookie": buildAuthCookie(token) }
    );
  }

  // 신규 사용자: Google 계정으로 자동 가입 (role 기본 family, 휴대폰 미입력)
  const now = new Date().toISOString();
  const { data: user, error: insErr } = await db
    .from("users")
    .insert({
      role: "family",
      google_email: email,
      google_name: name ?? null,
      google_picture: picture ?? null,
      privacy_agreed_at: now,
      terms_agreed_at: now,
    })
    .select("id, phone, role, location_sharing")
    .single();
  if (insErr || !user) throw new ApiError("INTERNAL_ERROR", insErr?.message ?? "가입 처리 실패");

  const token = signToken({ userId: user.id, role: user.role, phone: user.phone ?? "" });
  return ok(
    {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      locationSharing: user.location_sharing,
      groupId: null,
    },
    201,
    { "Set-Cookie": buildAuthCookie(token) }
  );
});
