// groups.ts — 그룹/구성원 조회 공통 헬퍼 (service_role 클라이언트 사용)
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db.types";
import { ApiError } from "./api";

type DB = SupabaseClient<Database>;

/** 사용자가 속한 첫 번째 그룹의 membership 행. 없으면 null */
export async function findMembership(db: DB, userId: string) {
  const { data, error } = await db
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);
  return data;
}

/** 사용자가 해당 그룹의 구성원인지 검사. 아니면 ApiError(403) */
export async function assertMember(db: DB, groupId: string, userId: string) {
  const { data, error } = await db
    .from("group_members")
    .select("id, role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);
  if (!data) throw new ApiError("FORBIDDEN", "해당 그룹의 구성원이 아닙니다.");
  return data;
}

/** 그룹 구성원 user_id 목록 (본인 제외 옵션) */
export async function groupMemberIds(db: DB, groupId: string, excludeUserId?: string): Promise<string[]> {
  const { data, error } = await db
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);
  return (data ?? [])
    .map((r) => r.user_id)
    .filter((id) => id !== excludeUserId);
}

/** 그룹 내 parent(부모님) 사용자. 없으면 null */
export async function findGroupParent(db: DB, groupId: string) {
  const { data: members, error } = await db
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);
  const ids = (members ?? []).map((m) => m.user_id);
  if (ids.length === 0) return null;
  const { data: parent, error: e2 } = await db
    .from("users")
    .select("id, location_sharing, last_seen_at")
    .in("id", ids)
    .eq("role", "parent")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (e2) throw new ApiError("INTERNAL_ERROR", e2.message);
  return parent;
}
