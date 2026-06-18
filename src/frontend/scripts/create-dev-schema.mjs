// dev 스키마 생성 스크립트 — 로컬 개발 데이터 분리용
// 사용: node --env-file=.env.local scripts/create-dev-schema.mjs
//
// 목적: 운영(public) 과 동일한 구조의 dev 스키마를 같은 Supabase 프로젝트에 만든다.
//   로컬은 SUPABASE_SCHEMA=dev 로 dev 스키마를 사용하고(.env.local),
//   운영(Vercel)은 public 을 그대로 사용한다.
//
// 동작:
//   1) ENUM 타입은 public 에 이미 있으므로 재사용 (스키마 한정 없이 참조 가능).
//   2) supabase/migrations/0001_init.sql, 0002, 0003 을 search_path=dev 로 재실행.
//      => 테이블/인덱스가 dev 스키마에 생성된다 (모두 비한정 이름이므로 search_path 적용).
//   3) 0002_retention_and_rls.sql 의 pg_cron 블록은 실패 허용(운영과 동일).
//
// 주의: dev 스키마는 Supabase 대시보드 > Settings > API > Exposed schemas 에
//       'dev' 를 추가해야 REST 클라이언트(@supabase/supabase-js)로 접근 가능하다.
import pg from "pg";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");

function buildCandidates() {
  const direct = process.env.DATABASE_URL;
  const candidates = [];
  if (direct) candidates.push({ label: "direct", conn: direct });
  const m = direct?.match(/postgres(?:ql)?:\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co/i);
  const pw = m?.[1] ?? process.env.SUPABASE_DB_PASSWORD;
  const ref =
    m?.[2] ?? process.env.SUPABASE_URL?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
  if (pw && ref) {
    const regions = process.env.POOLER_REGION
      ? [process.env.POOLER_REGION]
      : ["ap-northeast-2", "ap-northeast-1", "ap-southeast-1", "us-east-1", "us-west-1", "eu-central-1"];
    for (const region of regions) {
      for (const fleet of ["aws-1", "aws-0"]) {
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
  console.error("모든 연결 후보 실패. POOLER_REGION 으로 리전을 지정해 보세요.");
  process.exit(1);
}

const client = await connectAny();

// 1) dev 스키마 생성 + search_path 를 dev,public 으로 설정.
//    public 을 뒤에 두어 ENUM 타입(user_role 등)을 그대로 참조한다.
await client.query("create schema if not exists dev;");
await client.query("set search_path to dev, public;");
console.log("dev 스키마 준비 완료. search_path=dev,public");

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  let sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  // ENUM 생성 블록은 public 에 이미 존재하므로 dev 재실행 시 중복 — duplicate_object 는 무시되도록
  // 원본이 do$$ ... exception when duplicate_object then null 로 감싸져 있어 그대로 두어도 안전.
  process.stdout.write(`적용(dev) 중: ${file} ... `);
  try {
    await client.query(sql);
    console.log("OK");
  } catch (e) {
    if (/pg_cron|cron\./i.test(e.message)) {
      console.log(`SKIP (pg_cron 미지원)`);
    } else {
      console.error(`FAIL: ${e.message}`);
      await client.end();
      process.exit(2);
    }
  }
}

// 4) PostgREST 역할에 dev 스키마 사용/조작 권한 부여.
//    public 과 달리 새 스키마는 기본 권한이 없으므로 명시적으로 GRANT 해야
//    REST 클라이언트가 접근 가능하다. (운영 public 은 미변경)
//    범위 최소화: 로컬 개발은 service_role 키로만 동작하므로 service_role 에만 부여한다.
//    (anon/authenticated 에는 부여하지 않아 dev 스키마는 service_role 외 접근 불가)
await client.query(`
  grant usage on schema dev to service_role;
  grant all on all tables in schema dev to service_role;
  grant all on all sequences in schema dev to service_role;
  alter default privileges in schema dev grant all on tables to service_role;
  alter default privileges in schema dev grant all on sequences to service_role;
`);
console.log("dev 스키마 권한 부여 완료 (service_role 한정).");

// PostgREST 스키마 캐시 리로드 — 새 권한/테이블을 즉시 반영
await client.query(`notify pgrst, 'reload schema';`);

const { rows } = await client.query(
  "select table_name from information_schema.tables where table_schema='dev' order by table_name"
);
console.log(`\ndev 스키마 테이블 ${rows.length}개:`);
console.log(rows.map((r) => `  - ${r.table_name}`).join("\n"));

await client.end();
console.log("\ndev 스키마 생성 완료. 다음: Supabase 대시보드 Exposed schemas 에 'dev' 추가.");
