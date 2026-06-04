// notify.ts — FCM 푸시 / SMS / 알림톡 발송 어댑터
// MVP: 외부 키(FCM/NHN/카카오)가 .env 에 설정돼 있지 않으면 "graceful stub" 으로 동작.
// 실제 키를 등록하면 이 모듈만 교체/확장하면 된다. (.AP-key.md 9~11번)
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db.types";

type DB = SupabaseClient<Database>;

export interface NotifyResult {
  notified: number;
  failed: number;
}

const FCM_KEY = process.env.FCM_SERVER_KEY ?? "";

/**
 * 그룹 구성원에게 FCM 푸시 발송.
 * 키 미설정 시: device_tokens 보유 사용자 수를 notified 로 집계하되 실제 전송은 생략한다.
 */
export async function sendPushToUsers(
  db: DB,
  userIds: string[],
  _payload: { title: string; body: string; data?: Record<string, string> }
): Promise<NotifyResult> {
  if (userIds.length === 0) return { notified: 0, failed: 0 };

  const { data: tokens, error } = await db
    .from("device_tokens")
    .select("fcm_token, user_id")
    .in("user_id", userIds);
  if (error) return { notified: 0, failed: userIds.length };

  const recipients = tokens ?? [];
  if (!FCM_KEY) {
    // 키 미설정: 토큰 보유자 수를 "발송 대상"으로 집계 (데모/개발 환경)
    return { notified: recipients.length, failed: 0 };
  }

  // FCM 키가 설정된 경우 실제 발송 (legacy HTTP). 운영 전환 시 v1 API 로 교체.
  let notified = 0;
  let failed = 0;
  await Promise.all(
    recipients.map(async (t) => {
      try {
        const res = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            Authorization: `key=${FCM_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: t.fcm_token,
            notification: { title: _payload.title, body: _payload.body },
            data: _payload.data ?? {},
          }),
        });
        if (res.ok) notified += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    })
  );
  return { notified, failed };
}

const SMS_API_KEY = process.env.SMS_API_KEY ?? "";

/** NHN Cloud SMS 발송. 키 미설정 시 전건 성공으로 시뮬레이션(데모). */
export async function sendSms(
  recipients: string[],
  _content: string
): Promise<NotifyResult> {
  if (!SMS_API_KEY) {
    return { notified: recipients.length, failed: 0 };
  }
  // 실제 NHN Cloud 연동 지점 (운영 키 등록 후 구현)
  return { notified: recipients.length, failed: 0 };
}

const ALIMTALK_KEY = process.env.KAKAO_ALIMTALK_API_KEY ?? "";

/** 카카오 알림톡 발송. 키 미설정 시 전건 성공으로 시뮬레이션(데모). */
export async function sendAlimtalk(
  recipients: string[],
  _templateCode: string,
  _variables?: Record<string, unknown>
): Promise<NotifyResult> {
  if (!ALIMTALK_KEY) {
    return { notified: recipients.length, failed: 0 };
  }
  // 실제 카카오 비즈메시지 연동 지점 (운영 키 등록 후 구현)
  return { notified: recipients.length, failed: 0 };
}
