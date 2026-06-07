// 입력값 검증 유틸 — 순수 함수. 단위 테스트 대상 (F-001, F-002, F-003, F-004, F-018)

/** 휴대폰 번호(01012345678 또는 010-1234-5678)를 11자리 숫자로 정규화. 유효하지 않으면 null */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // 010으로 시작하는 11자리만 허용 (F-001, F-002)
  if (/^010\d{8}$/.test(digits)) return digits;
  return null;
}

/** 010-1234-5678 형태로 하이픈 포맷팅 */
export function formatPhone(digits: string): string {
  const normalized = normalizePhone(digits);
  if (!normalized) return digits;
  return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
}

/** 역할 검증 (F-001) */
export type Role = "parent" | "family" | "admin";
export function isValidRole(role: string): role is Role {
  return role === "parent" || role === "family" || role === "admin";
}

/** 6자리 영숫자 초대 코드 생성 (대문자+숫자, 혼동 문자 제외) (F-003) */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // I,O,0,1 제외
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** 초대 코드 형식 검증 (F-004) */
export function isValidInviteCode(code: string): boolean {
  return /^[A-Z2-9]{6}$/.test(code);
}

/** 그룹명 검증 — 1~20자, 공백만은 불가 (F-003) */
export function isValidGroupName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 20;
}

/** 호칭/관계 라벨 검증 — 1~20자 (빈 문자열은 "지정 해제"로 별도 처리) */
export function isValidRelation(relation: string): boolean {
  const trimmed = relation.trim();
  return trimmed.length >= 1 && trimmed.length <= 20;
}

/** 채팅 메시지 검증 — 1~500자 (F-018) */
export function isValidChatMessage(content: string): boolean {
  const len = content.trim().length;
  return len >= 1 && len <= 500;
}

export const MAX_GROUP_MEMBERS = 5; // Free 플랜 정원 (F-004)
export const SOS_COUNTDOWN_SEC = 2; // SOS 오조작 방지 카운트다운 (F-015)
export const LOCATION_INTERVAL_NORMAL = 30; // 일반 위치 전송 주기(초) (F-009)
export const LOCATION_INTERVAL_SAVING = 180; // 배터리 절약 주기(초) (F-027)
export const LOCATION_RETENTION_DAYS = 7; // 위치 이력 보관 일수 (F-009)
export const GPS_ACCURACY_THRESHOLD = 100; // 정확도 필터(m) (F-009)
