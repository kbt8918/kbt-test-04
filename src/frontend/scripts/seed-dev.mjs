// dev 스키마 로컬 테스트 데이터 시드
// 사용: node --env-file=.env.local scripts/seed-dev.mjs
//
// 전제: 1) scripts/create-dev-schema.mjs 로 dev 스키마 생성 완료
//       2) Supabase 대시보드 Exposed schemas 에 'dev' 추가 완료
//       3) .env.local 에 SUPABASE_SCHEMA=dev 설정
//
// 생성 데이터: 관리자 1, 부모 1, 가족 2, 가족그룹 1(부모+가족2), 채팅 메시지 2.
// 모든 데이터는 dev 스키마에만 들어가며 운영(public)에 영향 없음.
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.SUPABASE_SCHEMA ?? "public";
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 필요합니다.");
  process.exit(1);
}
if (schema !== "dev") {
  console.error(`SUPABASE_SCHEMA 가 'dev' 가 아닙니다(현재: ${schema}). 운영 데이터 보호를 위해 중단합니다.`);
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false }, db: { schema } });
const now = new Date().toISOString();
const hash = (pw) => bcrypt.hashSync(pw, 8);

async function upsertUser(u) {
  const { data: existing } = await db.from("users").select("id").eq("phone", u.phone).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await db.from("users").insert(u).select("id").single();
  if (error) throw new Error(`user ${u.phone}: ${error.message}`);
  return data.id;
}

const adminId = await upsertUser({
  phone: "01000000000", role: "admin", password_hash: hash("ansim:01000000000"),
  name: "로컬관리자", privacy_agreed_at: now, terms_agreed_at: now,
});
const parentId = await upsertUser({
  phone: "01011112222", role: "parent", password_hash: hash("ansim:01011112222"),
  name: "로컬부모", privacy_agreed_at: now, terms_agreed_at: now,
});
const child1Id = await upsertUser({
  phone: "01033334444", role: "family", password_hash: hash("ansim:01033334444"),
  name: "로컬자녀1", privacy_agreed_at: now, terms_agreed_at: now,
});
const child2Id = await upsertUser({
  phone: "01055556666", role: "family", password_hash: hash("ansim:01055556666"),
  name: "로컬자녀2", privacy_agreed_at: now, terms_agreed_at: now,
});

// 가족 그룹 (없으면 생성)
let groupId;
{
  const { data: g } = await db.from("groups").select("id").eq("invite_code", "DEV001").maybeSingle();
  if (g) {
    groupId = g.id;
  } else {
    const { data, error } = await db.from("groups")
      .insert({ name: "로컬가족", invite_code: "DEV001", created_by: child1Id, last_active_at: now })
      .select("id").single();
    if (error) throw new Error(`group: ${error.message}`);
    groupId = data.id;
  }
}

async function ensureMember(userId, role) {
  const { data } = await db.from("group_members")
    .select("id").eq("group_id", groupId).eq("user_id", userId).maybeSingle();
  if (data) return;
  const { error } = await db.from("group_members").insert({ group_id: groupId, user_id: userId, role });
  if (error) throw new Error(`member ${userId}: ${error.message}`);
}
await ensureMember(child1Id, "owner");
await ensureMember(child2Id, "member");
await ensureMember(parentId, "member");

// 채팅 메시지 (중복 방지: 기존 메시지 있으면 스킵)
{
  const { count } = await db.from("messages").select("*", { count: "exact", head: true }).eq("group_id", groupId);
  if (!count) {
    await db.from("messages").insert([
      { group_id: groupId, sender_id: child1Id, content: "엄마 잘 도착하셨어요?" },
      { group_id: groupId, sender_id: parentId, content: "응 잘 왔다" },
    ]);
  }
}

const { count: userCount } = await db.from("users").select("*", { count: "exact", head: true });
console.log(`dev 시드 완료. 스키마=dev, users=${userCount}`);
console.log("로컬 로그인:");
console.log("  관리자 01000000000 / 부모 01011112222 / 자녀 01033334444, 01055556666");
console.log("  비밀번호는 모두 'ansim:<번호>' (예: ansim:01011112222)");
