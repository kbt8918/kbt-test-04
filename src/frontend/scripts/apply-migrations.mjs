// Supabase 마이그레이션 적용 스크립트
// 사용: node --env-file=.env.local scripts/apply-migrations.mjs
//   DATABASE_URL 로 연결하여 supabase/migrations/*.sql 을 순서대로 실행한다.
//   pg_cron 확장이 없는 플랜에서도 중단되지 않도록 0002 의 pg_cron 블록은 실패를 허용한다.
//
// 주의: 운영 Supabase 스키마를 변경한다. 실행 전 대상 프로젝트 URL 을 반드시 확인할 것.
import pg from "pg";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");

// 연결 후보 목록 구성:
//  1) DATABASE_URL 그대로 (직접 연결)
//  2) Supabase 풀러(IPv4) — 직접 호스트가 IPv6 전용이라 미해석되는 환경 대응
//     POOLER_REGION 으로 리전을 지정하면 그 리전만, 없으면 후보 리전을 순차 시도.
function buildCandidates() {
  const direct = process.env.DATABASE_URL;
  const candidates = [];
  if (direct) candidates.push({ label: "direct", conn: direct });

  // DATABASE_URL 에서 ref·password 추출 (없으면 풀러 후보 생략)
  const m = direct?.match(/postgres(?:ql)?:\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co/i);
  const pw = m?.[1] ?? process.env.SUPABASE_DB_PASSWORD;
  const ref =
    m?.[2] ?? (process.env.SUPABASE_URL?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1]);
  if (pw && ref) {
    const regions = process.env.POOLER_REGION
      ? [process.env.POOLER_REGION]
      : ["ap-northeast-2", "ap-northeast-1", "ap-southeast-1", "us-east-1", "us-west-1", "eu-central-1"];
    const fleets = ["aws-1", "aws-0"];
    for (const region of regions) {
      for (const fleet of fleets) {
        // session mode (5432) 는 DDL 트랜잭션을 지원
        candidates.push({
          label: `pooler:${fleet}-${region}`,
          conn: `postgresql://postgres.${ref}:${encodeURIComponent(pw)}@${fleet}-${region}.pooler.supabase.com:5432/postgres`,
        });
      }
    }
  }
  return candidates;
}

async function connectAny() {
  const candidates = buildCandidates();
  if (candidates.length === 0) {
    console.error("DATABASE_URL 또는 SUPABASE_URL+SUPABASE_DB_PASSWORD 가 필요합니다.");
    process.exit(1);
  }
  for (const { label, conn } of candidates) {
    const host = conn.match(/@([^:/]+)/)?.[1] ?? "(unknown)";
    const c = new pg.Client({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 9000,
    });
    try {
      await c.connect();
      console.log(`연결 성공 (${label}) host=${host}`);
      return c;
    } catch (e) {
      console.log(`연결 실패 (${label}) host=${host}: ${e.message}`);
      try {
        await c.end();
      } catch {
        /* ignore */
      }
    }
  }
  console.error("모든 연결 후보 실패. POOLER_REGION 환경변수로 리전을 지정해 보세요.");
  process.exit(1);
}

const client = await connectAny();

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  process.stdout.write(`적용 중: ${file} ... `);
  try {
    await client.query(sql);
    console.log("OK");
  } catch (e) {
    // pg_cron 미설치 등 환경 제약은 경고로 처리하고 계속 진행
    if (/pg_cron|cron\./i.test(e.message)) {
      console.log(`SKIP (pg_cron 미지원: ${e.message})`);
    } else {
      console.error(`FAIL: ${e.message}`);
      await client.end();
      process.exit(2);
    }
  }
}

const { rows } = await client.query(
  "select table_name from information_schema.tables where table_schema='public' order by table_name"
);
console.log(`\npublic 스키마 테이블 ${rows.length}개:`);
console.log(rows.map((r) => `  - ${r.table_name}`).join("\n"));

await client.end();
console.log("\n마이그레이션 완료.");
