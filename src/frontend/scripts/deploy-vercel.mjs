// Vercel 배포 자동화 — 토큰만 있으면 링크·환경변수 등록·프로덕션 배포를 한 번에 수행.
// 사용:
//   1) https://vercel.com/account/tokens 에서 토큰 발급
//   2) PowerShell:  $env:VERCEL_TOKEN="vercel_xxx"; node --env-file=.env.local scripts/deploy-vercel.mjs
//      (또는 bash:  VERCEL_TOKEN=vercel_xxx node --env-file=.env.local scripts/deploy-vercel.mjs)
//
// 환경변수 값은 .env.local 에서 읽어 Vercel Production 에 등록한다(코드에 시크릿 하드코딩 없음).
import { execFileSync } from "child_process";

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("VERCEL_TOKEN 이 필요합니다. https://vercel.com/account/tokens 에서 발급 후 환경변수로 설정하세요.");
  process.exit(1);
}

// Vercel Production 에 등록할 환경변수 (NEXT_PUBLIC_* 만 클라이언트 노출)
const ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_KAKAO_MAP_KEY",
  "KAKAO_MAP_API_KEY",
];

function vercel(args, input) {
  return execFileSync("npx", ["vercel", ...args, "--token", token, "--yes"], {
    input,
    encoding: "utf8",
    stdio: input !== undefined ? ["pipe", "inherit", "inherit"] : "inherit",
    shell: process.platform === "win32",
  });
}

console.log("1) 프로젝트 링크…");
try {
  vercel(["link"]);
} catch {
  console.error("link 실패 — 토큰 권한/네트워크를 확인하세요.");
  process.exit(2);
}

console.log("\n2) 환경변수 등록(Production)…");
for (const key of ENV_KEYS) {
  const val = process.env[key];
  if (!val) {
    console.log(`  - ${key}: (값 없음, 건너뜀)`);
    continue;
  }
  try {
    // 이미 있으면 제거 후 재등록 (idempotent)
    try {
      vercel(["env", "rm", key, "production"]);
    } catch {
      /* 없으면 무시 */
    }
    vercel(["env", "add", key, "production"], val + "\n");
    console.log(`  - ${key}: 등록 완료`);
  } catch {
    console.log(`  - ${key}: 등록 실패(수동 등록 필요)`);
  }
}

console.log("\n3) 프로덕션 배포…");
vercel(["--prod"]);
console.log("\n배포 완료. 위 URL 로 접속해 확인하세요.");
