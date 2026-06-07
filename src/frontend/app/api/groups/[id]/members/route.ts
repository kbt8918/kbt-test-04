// 그룹 멤버 호칭(관계) 지정 — PATCH /api/groups/:id/members
// 가족이 그룹 내 부모님 멤버의 호칭(어머니/아버지 등)을 지정/해제한다.
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireAuth, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { assertMember } from "@/lib/groups";
import { isValidRelation } from "@/lib/validation";

export const runtime = "nodejs";

interface Body {
  userId?: string;
  // 호칭 문자열, 또는 null/"" 이면 지정 해제
  relation?: string | null;
}

export const PATCH = handler(async (req: NextRequest, { params }) => {
  const auth = requireAuth(req);
  const groupId = params.id;
  const body = await readJson<Body>(req);

  const targetUserId = (body.userId ?? "").trim();
  if (!targetUserId) return fail("BAD_REQUEST", "대상 사용자(userId)가 필요합니다.");

  // 호칭 정규화: 빈 값이면 해제(null), 값이 있으면 형식 검증
  const raw = body.relation;
  let relation: string | null;
  if (raw === null || raw === undefined || raw.trim() === "") {
    relation = null;
  } else if (!isValidRelation(raw)) {
    return fail("BAD_REQUEST", "호칭은 1~20자여야 합니다.");
  } else {
    relation = raw.trim();
  }

  const db = createAdminClient();

  // 요청자(가족)와 대상 모두 같은 그룹 구성원이어야 함
  await assertMember(db, groupId, auth.userId);
  await assertMember(db, groupId, targetUserId);

  const { data, error } = await db
    .from("group_members")
    .update({ relation })
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .select("user_id, relation")
    .single();
  if (error || !data) throw new ApiError("INTERNAL_ERROR", error?.message ?? "호칭 저장에 실패했습니다.");

  return ok({ userId: data.user_id, relation: data.relation });
});
