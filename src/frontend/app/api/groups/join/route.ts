// API-006 가족 그룹 참여 — POST /api/groups/join
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireAuth, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { isValidInviteCode } from "@/lib/validation";

export const runtime = "nodejs";

interface Body {
  inviteCode?: string;
}

export const POST = handler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  const body = await readJson<Body>(req);
  const code = (body.inviteCode ?? "").toUpperCase();
  if (!isValidInviteCode(code)) return fail("BAD_REQUEST", "초대 코드 형식이 올바르지 않습니다.");

  const db = createAdminClient();
  const { data: group } = await db
    .from("groups")
    .select("id, name, max_members")
    .eq("invite_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (!group) return fail("NOT_FOUND", "유효하지 않은 초대 코드입니다.");

  const { data: already } = await db
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (already) return fail("CONFLICT", "이미 참여 중인 그룹입니다.");

  const { count, error: cErr } = await db
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", group.id);
  if (cErr) throw new ApiError("INTERNAL_ERROR", cErr.message);
  if ((count ?? 0) >= group.max_members)
    return fail("UNPROCESSABLE", `그룹 인원 한도(${group.max_members}명)를 초과하여 진입할 수 없습니다.`);

  const { error } = await db
    .from("group_members")
    .insert({ group_id: group.id, user_id: auth.userId, role: "member" });
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  return ok({
    groupId: group.id,
    groupName: group.name,
    memberCount: (count ?? 0) + 1,
    role: "member",
  });
});
