// API-031 Google OAuth 로그인 — POST /api/auth/google
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { signToken, buildAuthCookie } from "@/lib/jwt";
import { findMembership } from "@/lib/groups";

export const runtime = "nodejs";

interface Body {
  idToken?: string;
  accessToken?: string;
  email?: string;
  name?: string;
  picture?: string;
}

// Google ID 토큰 검증 (로컬 개발 모드에서는 스킵, production은 검증 필수)
async function verifyGoogleToken(token: string): Promise<any> {
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_SKIP_TOKEN_VERIFY === "true") {
    // 로컬 개발: 토큰 검증 스킵 (oauth playground에서 받은 토큰 직접 사용 가능)
    console.log("⚠️ Google ID token verification skipped in development");
    return null;
  }

  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/tokeninfo", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `id_token=${encodeURIComponent(token)}`,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || "토큰 검증 실패");
    }
    return data;
  } catch (e) {
    console.error("Google token verification error:", e);
    throw new Error("Google 토큰 검증에 실패했습니다.");
  }
}

// 사용자 정보 조회 (accessToken 사용)
async function fetchGoogleUserInfo(accessToken: string): Promise<any> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error("사용자 정보 조회 실패");
    }
    return await response.json();
  } catch (e) {
    console.error("Google userinfo fetch error:", e);
    return null;
  }
}

export const POST = handler(async (req: NextRequest) => {
  const body = await readJson<Body>(req);
  const { idToken, accessToken, email, name, picture } = body;

  if (!email) {
    return fail("BAD_REQUEST", "이메일 정보가 필요합니다.");
  }

  // 토큰 검증 (production: 필수, development: 선택)
  if (idToken && process.env.NODE_ENV !== "development") {
    try {
      await verifyGoogleToken(idToken);
    } catch (e) {
      return fail("UNAUTHORIZED", (e as Error).message);
    }
  }

  // accessToken으로 사용자 정보 보강 (선택)
  let googleUser = { email, name, picture };
  if (accessToken) {
    const userInfo = await fetchGoogleUserInfo(accessToken);
    if (userInfo) {
      googleUser = { ...googleUser, ...userInfo };
    }
  }

  const db = createAdminClient();

  // 이메일로 기존 사용자 조회
  const { data: existing } = await db
    .from("users")
    .select("id, phone, role, location_sharing")
    .eq("google_email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    // 기존 사용자: 로그인
    await db.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", existing.id);
    const membership = await findMembership(db, existing.id);
    const token = signToken({ userId: existing.id, role: existing.role, phone: existing.phone });

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

  // 신규 사용자: 생성 및 로그인
  const now = new Date().toISOString();
  const newUserId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const { data: user, error } = await db
    .from("users")
    .insert({
      id: newUserId,
      google_email: email,
      phone: null, // Google 계정은 초기 휴대폰 미입력
      role: "family", // Google OAuth는 가족 역할로 기본 설정
      password_hash: "google_oauth", // sentinel
      privacy_agreed_at: now,
      terms_agreed_at: now,
      google_name: name,
      google_picture: picture,
    })
    .select("id, phone, role, location_sharing, created_at")
    .single();

  if (error || !user) {
    return fail("INTERNAL_ERROR", error?.message ?? "사용자 생성에 실패했습니다.");
  }

  const token = signToken({ userId: user.id, role: user.role, phone: user.phone || "" });
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
