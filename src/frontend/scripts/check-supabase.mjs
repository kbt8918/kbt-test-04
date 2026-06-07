// Supabase 연결 스모크 테스트
// 사용: npm install 후 ->  node --env-file=.env.local scripts/check-supabase.mjs
// 마이그레이션(0001_init.sql) 적용 후 실행하면 users 테이블 카운트를 조회한다.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 없습니다.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const { count, error } = await supabase
  .from("users")
  .select("*", { count: "exact", head: true });

if (error) {
  console.error("연결 실패 또는 마이그레이션 미적용:", error.message);
  console.error("-> Supabase SQL Editor 에서 supabase/migrations/0001_init.sql 을 먼저 실행하세요.");
  process.exit(1);
}

console.log(`Supabase 연결 성공. users 테이블 레코드 수: ${count}`);
