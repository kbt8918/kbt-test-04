// 관리자(admin) 계정 시드 — 회원가입 API 는 parent/family 만 허용하므로 관리자는 직접 시드한다.
// 사용: node --env-file=.env.local scripts/seed-admin.mjs 01000000000
//   인자로 받은 휴대폰 번호(11자리)로 role=admin 사용자를 upsert 한다.
//   로그인은 /api/auth/login 에 해당 번호를 넣으면 admin 으로 진입한다.
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const phoneArg = process.argv[2];
const phone = (phoneArg ?? "").replace(/\D/g, "");
if (!/^010\d{8}$/.test(phone)) {
  console.error("사용법: node --env-file=.env.local scripts/seed-admin.mjs 010XXXXXXXX");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 필요합니다.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const now = new Date().toISOString();
const passwordHash = await bcrypt.hash(`ansim:${phone}`, 8);

const { data: existing } = await db.from("users").select("id, role").eq("phone", phone).maybeSingle();
if (existing) {
  await db.from("users").update({ role: "admin" }).eq("id", existing.id);
  console.log(`기존 사용자(${phone})를 admin 으로 변경했습니다. id=${existing.id}`);
} else {
  const { data, error } = await db
    .from("users")
    .insert({
      phone,
      role: "admin",
      password_hash: passwordHash,
      privacy_agreed_at: now,
      terms_agreed_at: now,
    })
    .select("id")
    .single();
  if (error) {
    console.error("시드 실패:", error.message);
    process.exit(2);
  }
  console.log(`admin 계정 생성 완료. phone=${phone} id=${data.id}`);
}
console.log("로그인: /api/auth/login 에 해당 번호로 로그인하면 관리자 화면으로 진입합니다.");
