// JWT 발급·검증 유틸 (F-001, F-002) — httpOnly 쿠키 저장, 7일 만료
import jwt from "jsonwebtoken";
import type { Role } from "./validation";

const SECRET = process.env.JWT_SECRET ?? "";
export const TOKEN_COOKIE = "access_token";
export const TOKEN_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7일

export interface AuthPayload {
  userId: string;
  role: Role;
  phone: string;
}

export function signToken(payload: AuthPayload): string {
  if (!SECRET) throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_MAX_AGE_SEC });
}

/** 토큰 검증. 실패 시 null */
export function verifyToken(token: string | undefined): AuthPayload | null {
  if (!token || !SECRET) return null;
  try {
    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload & AuthPayload;
    return { userId: decoded.userId, role: decoded.role, phone: decoded.phone };
  } catch {
    return null;
  }
}

/** Set-Cookie 헤더 값 생성 (httpOnly, Secure, SameSite=Lax) */
export function buildAuthCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${TOKEN_COOKIE}=${token}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${TOKEN_MAX_AGE_SEC}`;
}

/** 로그아웃용 만료 쿠키 */
export function buildClearCookie(): string {
  return `${TOKEN_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
