// API-017 채팅 조회 (GET) / API-018 채팅 전송 (POST)
// URL: /api/chat/:groupId/messages (해당 그룹 구성원)
import { NextRequest } from "next/server";
import { handler, ok, fail, readJson, requireAuth, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase";
import { assertMember, groupMemberIds } from "@/lib/groups";
import { isValidChatMessage } from "@/lib/validation";
import { sendPushToUsers } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

export const GET = handler(async (req: NextRequest, { params }) => {
  const auth = requireAuth(req);
  const groupId = params.groupId;
  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, MAX_LIMIT);

  const db = createAdminClient();
  await assertMember(db, groupId, auth.userId);

  let query = db
    .from("messages")
    .select("id, sender_id, content, sent_at")
    .eq("group_id", groupId)
    .order("sent_at", { ascending: false })
    .limit(limit + 1);

  if (before) {
    const { data: cursor } = await db.from("messages").select("sent_at").eq("id", before).maybeSingle();
    if (cursor) query = query.lt("sent_at", cursor.sent_at);
  }

  const { data, error } = await query;
  if (error) throw new ApiError("INTERNAL_ERROR", error.message);

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  // 최신순으로 가져온 뒤 오래된→최신 순서로 뒤집어 반환
  const ordered = [...page].reverse();

  return ok({
    messages: ordered.map((m) => ({
      messageId: m.id,
      senderId: m.sender_id,
      content: m.content,
      sentAt: m.sent_at,
    })),
    hasMore,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});

interface PostBody {
  content?: string;
}

export const POST = handler(async (req: NextRequest, { params }) => {
  const auth = requireAuth(req);
  const groupId = params.groupId;
  const body = await readJson<PostBody>(req);
  const content = (body.content ?? "").trim();
  if (!isValidChatMessage(content))
    return fail("BAD_REQUEST", "메시지는 1~500자여야 합니다.");

  const db = createAdminClient();
  await assertMember(db, groupId, auth.userId);

  const { data: msg, error } = await db
    .from("messages")
    .insert({ group_id: groupId, sender_id: auth.userId, content })
    .select("id, sender_id, content, sent_at")
    .single();
  if (error || !msg) throw new ApiError("INTERNAL_ERROR", error?.message ?? "메시지 전송 실패");

  // 미접속 구성원 FCM 알림 (베스트에포트)
  const memberIds = await groupMemberIds(db, groupId, auth.userId);
  await sendPushToUsers(db, memberIds, {
    title: "가족 채팅 새 메시지",
    body: content.slice(0, 40),
    data: { type: "chat", groupId },
  });

  return ok(
    { messageId: msg.id, senderId: msg.sender_id, content: msg.content, sentAt: msg.sent_at },
    201
  );
});
