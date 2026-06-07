// Supabase 클라이언트 — 서버리스(Vercel) 환경 전용 팩토리
// service_role 키는 백엔드(Route Handler)에서만 사용. 프론트엔드 노출 금지 (.AP-key.md 주의 참조)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db.types";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function assertEnv(name: string, value: string): void {
  if (!value) throw new Error(`${name} 환경변수가 설정되지 않았습니다.`);
}

/**
 * publishable(anon) 키 기반 클라이언트.
 * RLS 정책의 적용을 받는 일반 요청에 사용한다.
 */
export function createPublicClient(): SupabaseClient<Database> {
  assertEnv("SUPABASE_URL", SUPABASE_URL);
  assertEnv("SUPABASE_KEY", SUPABASE_KEY);
  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let adminClient: SupabaseClient<Database> | null = null;

/**
 * service_role 키 기반 관리자 클라이언트 (RLS 우회).
 * 서버(Route Handler) 전용 — 절대 클라이언트 번들에 포함하지 말 것.
 * Route Handler에서 JWT 검증(verifyToken) 후 권한을 직접 확인한 뒤 사용한다.
 */
export function createAdminClient(): SupabaseClient<Database> {
  assertEnv("SUPABASE_URL", SUPABASE_URL);
  assertEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  if (adminClient) return adminClient;
  adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
