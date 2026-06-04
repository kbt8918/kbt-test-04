// API-025 SMS 발송 — POST /api/admin/sms (role: admin)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireRole, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { sendSms } from "@/lib/notify";

export const runtime = "nodejs";

interface Body {
  recipients?: string[];
  content?: string;
}

const SMS_MAX_LEN = 90; // 90자 이하 SMS, 초과 시 LMS

export const POST = handler(async (req: NextRequest) => {
  const auth = requireRole(req, "admin");
  const body = await readJson<Body>(req);
  const recipients = (body.recipients ?? []).filter(Boolean);
  const content = (body.content ?? "").trim();
  if (recipients.length === 0) return fail("BAD_REQUEST", "수신 대상이 1개 이상 필요합니다.");
  if (!content) return fail("BAD_REQUEST", "메시지 내용이 필요합니다.");
  if (content.length > 2000) return fail("BAD_REQUEST", "메시지는 최대 2000자입니다.");

  const channel: "sms" | "lms" = content.length > SMS_MAX_LEN ? "lms" : "sms";
  const result = await sendSms(recipients, content);
  const status = result.failed === 0 ? "success" : result.notified === 0 ? "fail" : "partial";

  const db = createAdminClient();
  const { data: log, error } = await db
    .from("sms_logs")
    .insert({
      admin_id: auth.userId,
      channel,
      content,
      recipients,
      total_count: recipients.length,
      success_count: result.notified,
      fail_count: result.failed,
      status,
    })
    .select("sent_at")
    .single();
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  return ok({
    messageType: channel.toUpperCase(),
    totalCount: recipients.length,
    successCount: result.notified,
    failCount: result.failed,
    sentAt: log?.sent_at ?? new Date().toISOString(),
  });
});
