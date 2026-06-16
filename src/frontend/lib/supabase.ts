// Supabase 클라이언트 — 서버리스(Vercel) 환경 전용 팩토리
// service_role 키는 백엔드(Route Handler)에서만 사용. 프론트엔드 노출 금지 (.AP-key.md 주의 참조)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db.types";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
// DB 스키마 분리: 로컬 개발은 SUPABASE_SCHEMA=dev 로 dev 스키마를 사용하고,
// 운영(Vercel)은 미설정(=public)으로 동작한다. 같은 Supabase 프로젝트 안에서
// 로컬 테스트 데이터와 운영 실데이터를 분리하기 위함.
// 주의: dev 스키마는 Supabase 대시보드 > Settings > API > Exposed schemas 에
//       추가되어야 PostgREST(REST 클라이언트)로 접근 가능하다.
// public(운영) | dev(로컬) — db.types.ts 의 Database 는 두 스키마를 동일 구조로 선언한다.
type SchemaName = "public" | "dev";
const SUPABASE_SCHEMA: SchemaName = process.env.SUPABASE_SCHEMA === "dev" ? "dev" : "public";

// 활성 스키마를 명시한 클라이언트 타입 — 두 스키마가 같은 테이블 구조를 공유하므로 동작 동일.
// lib/groups.ts, lib/notify.ts 등 클라이언트를 주입받는 헬퍼도 이 타입을 재사용한다.
export type DbClient = SupabaseClient<Database, SchemaName>;

function assertEnv(name: string, value: string): void {
  if (!value) throw new Error(`${name} 환경변수가 설정되지 않았습니다.`);
}

/**
 * publishable(anon) 키 기반 클라이언트.
 * RLS 정책의 적용을 받는 일반 요청에 사용한다.
 */
export function createPublicClient(): DbClient {
  assertEnv("SUPABASE_URL", SUPABASE_URL);
  assertEnv("SUPABASE_KEY", SUPABASE_KEY);
  return createClient<Database, SchemaName>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: SUPABASE_SCHEMA },
  });
}

let adminClient: DbClient | null = null;

/**
 * service_role 키 기반 관리자 클라이언트 (RLS 우회).
 * 서버(Route Handler) 전용 — 절대 클라이언트 번들에 포함하지 말 것.
 * Route Handler에서 JWT 검증(verifyToken) 후 권한을 직접 확인한 뒤 사용한다.
 */
export function createAdminClient(): DbClient {
  assertEnv("SUPABASE_URL", SUPABASE_URL);
  assertEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  if (adminClient) return adminClient;
  adminClient = createClient<Database, SchemaName>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: SUPABASE_SCHEMA },
  });
  return adminClient;
}
