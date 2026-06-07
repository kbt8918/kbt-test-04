// API-001 회원가입 — POST /api/auth/register
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { handler, ok, fail, readJson, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { normalizePhone, isValidRole } from "@/lib/validation";
import { signToken, buildAuthCookie } from "@/lib/jwt";

export const runtime = "nodejs";

interface Body {
  phone?: string;
  role?: string;
  termsAgreed?: boolean;
  privacyAgreed?: boolean;
  googleEmail?: string;
  googleName?: string;
  googlePicture?: string;
}

export const POST = handler(async (req: NextRequest) => {
  const body = await readJson<Body>(req);
  const phone = normalizePhone(body.phone ?? "");
  if (!phone) return fail("BAD_REQUEST", "휴대폰 번호 형식이 올바르지 않습니다.");
  if (!body.role || !isValidRole(body.role) || body.role === "admin")
    return fail("BAD_REQUEST", "역할은 parent 또는 family 여야 합니다.");
  if (body.termsAgreed !== true || body.privacyAgreed !== true)
    return fail("BAD_REQUEST", "이용약관과 개인정보처리방침에 동의해야 합니다.");

  const db = createAdminClient();

  const { data: existing } = await db.from("users").select("id").eq("phone", phone).maybeSingle();
  if (existing) return fail("CONFLICT", "이미 가입된 휴대폰 번호입니다.");

  // Google 계정 연동 가입이면 동일 이메일 중복 확인
  const googleEmail = body.googleEmail?.trim() || null;
  if (googleEmail) {
    const { data: dupGoogle } = await db
      .from("users")
      .select("id")
      .eq("google_email", googleEmail)
      .maybeSingle();
    if (dupGoogle) return fail("CONFLICT", "이미 연동된 Google 계정입니다.");
  }

  // MVP: 휴대폰 기반 가입 — sentinel 해시 저장
  const passwordHash = await bcrypt.hash(`ansim:${phone}`, 8);
  const now = new Date().toISOString();

  const { data: user, error } = await db
    .from("users")
    .insert({
      phone,
      role: body.role,
      password_hash: passwordHash,
      privacy_agreed_at: now,
      terms_agreed_at: now,
      google_email: googleEmail,
      google_name: body.googleName?.trim() || null,
      google_picture: body.googlePicture?.trim() || null,
    })
    .select("id, phone, role, created_at")
    .single();
  if (error || !user) throw new ApiError("INTERNAL_ERROR", error?.message ?? "가입 처리 실패");

  const token = signToken({ userId: user.id, role: user.role, phone: user.phone ?? "" });
  return ok(
    { userId: user.id, phone: user.phone, role: user.role, createdAt: user.created_at },
    201,
    { "Set-Cookie": buildAuthCookie(token) }
  );
});
