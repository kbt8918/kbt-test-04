// API-005 가족 그룹 생성 — POST /api/groups (role: family)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { generateInviteCode, isValidGroupName } from "@/lib/validation";

export const runtime = "nodejs";

interface Body {
  groupName?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ansimmap.vercel.app";

export const POST = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "family");
  const body = await readJson<Body>(req);
  const name = (body.groupName ?? "").trim();
  if (!isValidGroupName(name)) return fail("BAD_REQUEST", "그룹명은 1~20자여야 합니다.");

  const db = createAdminClient();

  // 초대 코드 생성 (충돌 시 최대 3회 재시도)
  let inviteCode = "";
  for (let i = 0; i < 3; i += 1) {
    const candidate = generateInviteCode();
    const { data: dup } = await db.from("groups").select("id").eq("invite_code", candidate).maybeSingle();
    if (!dup) {
      inviteCode = candidate;
      break;
    }
  }
  if (!inviteCode) throw new ApiError("INTERNAL_ERROR", "초대 코드 생성에 실패했습니다.");

  const { data: group, error } = await db
    .from("groups")
    .insert({ name, invite_code: inviteCode, created_by: auth.userId, last_active_at: new Date().toISOString() })
    .select("id, name, invite_code, created_at")
    .single();
  if (error || !group) throw new ApiError("INTERNAL_ERROR", error?.message ?? "그룹 생성 실패");

  await db.from("group_members").insert({ group_id: group.id, user_id: auth.userId, role: "owner" });

  return ok(
    {
      groupId: group.id,
      groupName: group.name,
      inviteCode: group.invite_code,
      qrCodeUrl: `${APP_URL}/join?code=${group.invite_code}`,
      memberCount: 1,
      createdAt: group.created_at,
    },
    201
  );
});
