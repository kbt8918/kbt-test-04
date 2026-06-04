// API-027 알림톡 발송 이력 — GET /api/admin/alimtalk/history (role: admin)
import { NextRequest } from "next/server";
import { handler, ok, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest) => {
  requireRole(req, "admin");
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const perPage = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 100);
  const from = (page - 1) * perPage;

  const db = createAdminClient();
  const { data, error, count } = await db
    .from("alimtalk_logs")
    .select("id, template_code, recipient_count, success_count, fail_count, sent_at", {
      count: "exact",
    })
    .order("sent_at", { ascending: false })
    .range(from, from + perPage - 1);
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  return ok({
    total: count ?? (data?.length ?? 0),
    page,
    perPage,
    records: (data ?? []).map((r) => ({
      logId: r.id,
      templateCode: r.template_code,
      recipientCount: r.recipient_count,
      successCount: r.success_count,
      failCount: r.fail_count,
      sentAt: r.sent_at,
    })),
  });
});
