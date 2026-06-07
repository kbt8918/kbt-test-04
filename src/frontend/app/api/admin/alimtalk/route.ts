// API-026 카카오 알림톡 발송 — POST /api/admin/alimtalk (role: admin)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { sendAlimtalk } from "@/lib/notify";

export const runtime = "nodejs";

interface Body {
  recipients?: string[];
  templateCode?: string;
  variables?: Record<string, unknown>;
}

export const POST = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "admin");
  const body = await readJson<Body>(req);
  const recipients = (body.recipients ?? []).filter(Boolean);
  const templateCode = (body.templateCode ?? "").trim();
  if (recipients.length === 0 || !templateCode)
    return fail("BAD_REQUEST", "수신 대상과 템플릿 코드가 필요합니다.");

  const result = await sendAlimtalk(recipients, templateCode, body.variables);
  const status = result.failed === 0 ? "success" : result.notified === 0 ? "fail" : "partial";

  const db = createAdminClient();
  const { data: log, error } = await db
    .from("alimtalk_logs")
    .insert({
      admin_id: auth.userId,
      template_code: templateCode,
      variables: body.variables ?? null,
      recipient_count: recipients.length,
      success_count: result.notified,
      fail_count: result.failed,
      status,
    })
    .select("sent_at")
    .single();
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  return ok({
    totalCount: recipients.length,
    successCount: result.notified,
    failCount: result.failed,
    sentAt: log?.sent_at ?? new Date().toISOString(),
  });
});
