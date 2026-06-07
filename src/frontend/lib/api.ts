// api.ts — Route Handler 공통 유틸: 응답 봉투, 에러, 인증/권한 가드
// 출처: API스펙.md "공통 응답 구조" / "공통 에러 코드"
import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE, verifyToken, type AuthPayload } from "./jwt";
import type { Role } from "./validation";

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
};

/** 성공 응답 봉투 */
export function ok<T>(data: T, status = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ status: "success", data }, { status, headers });
}

/** 실패 응답 봉투 */
export function fail(code: ErrorCode, message: string, headers?: HeadersInit): NextResponse {
  return NextResponse.json(
    { status: "error", code, message },
    { status: STATUS_BY_CODE[code], headers }
  );
}

/** Route Handler 내부에서 throw 하면 표준 에러 응답으로 변환되는 예외 */
export class ApiError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/** 핸들러 래퍼 — ApiError/예기치 못한 오류를 표준 봉투로 변환 */
export function handler(
  fn: (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }): Promise<NextResponse> => {
    try {
      return await fn(req, ctx ?? { params: {} });
    } catch (e) {
      if (e instanceof ApiError) return fail(e.code, e.message);
      // 설정 누락(환경변수 등)도 여기로 들어옴 — 메시지는 노출하되 500 처리
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      // eslint-disable-next-line no-console
      console.error("[API] unhandled error:", msg);
      return fail("INTERNAL_ERROR", "서버 내부 오류가 발생했습니다.");
    }
  };
}

/** JWT 쿠키에서 인증 정보 추출. 없거나 만료 시 ApiError(401) */
export function requireAuth(req: NextRequest): AuthPayload {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const payload = verifyToken(token);
  if (!payload) throw new ApiError("UNAUTHORIZED", "인증 토큰이 없거나 만료되었습니다.");
  return payload;
}

/** 인증 + 역할 검사. role 불일치 시 ApiError(403) */
export function requireRole(req: NextRequest, role: Role): AuthPayload {
  const auth = requireAuth(req);
  if (auth.role !== role) throw new ApiError("FORBIDDEN", `${role} 권한이 필요합니다.`);
  return auth;
}

/** JSON 본문 파싱. 실패 시 ApiError(400) */
export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError("BAD_REQUEST", "요청 본문(JSON) 형식이 올바르지 않습니다.");
  }
}
