// API-023 관리자 그룹 목록 — GET /api/admin/groups (role: admin)
import { NextRequest } from "next/server";
import { handler, ok, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export const GET = handler(async (req: NextRequest) => {
  requireRole(req, "admin");
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const sort = url.searchParams.get("sort") ?? "createdAt";
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);

  const sortColumn =
    sort === "lastActiveAt" ? "last_active_at" : sort === "memberCount" ? "created_at" : "created_at";

  const db = createAdminClient();
  let query = db
    .from("groups")
    .select("id, name, created_at, last_active_at", { count: "exact" })
    .is("deleted_at", null);
  if (search) query = query.ilike("name", `%${search}%`);

  const from = (page - 1) * PER_PAGE;
  query = query.order(sortColumn, { ascending: order === "asc" }).range(from, from + PER_PAGE - 1);

  const { data, error, count } = await query;
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  // 구성원 수 집계
  const groupIds = (data ?? []).map((g) => g.id);
  const memberCounts: Record<string, number> = {};
  if (groupIds.length > 0) {
    const { data: members } = await db
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);
    for (const m of members ?? []) memberCounts[m.group_id] = (memberCounts[m.group_id] ?? 0) + 1;
  }

  let groups = (data ?? []).map((g) => ({
    groupId: g.id,
    groupName: g.name,
    memberCount: memberCounts[g.id] ?? 0,
    createdAt: g.created_at,
    lastActiveAt: g.last_active_at,
  }));
  if (sort === "memberCount")
    groups = groups.sort((a, b) =>
      order === "asc" ? a.memberCount - b.memberCount : b.memberCount - a.memberCount
    );

  return ok({ total: count ?? groups.length, page, perPage: PER_PAGE, groups });
});
