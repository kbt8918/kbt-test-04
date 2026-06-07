// API-003 로그아웃 — POST /api/auth/logout
import { NextRequest } from "next/server";
import { handler, ok, requireAuth } from "@/lib/api";
import { buildClearCookie } from "@/lib/jwt";

export const runtime = "nodejs";

export const POST = handler(async (req: NextRequest) => {
  requireAuth(req); // 유효 토큰 없으면 401
  return ok(null, 200, { "Set-Cookie": buildClearCookie() });
});
