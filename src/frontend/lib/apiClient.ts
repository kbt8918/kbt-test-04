"use client";
// apiClient.ts — 브라우저용 타입 안전 API 래퍼 (API스펙 API-001~029)
// 모든 요청은 httpOnly 쿠키(access_token)를 자동 전송한다(credentials: "include").

export class ApiClientError extends Error {
  code: string;
  httpStatus: number;
  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

interface SuccessEnvelope<T> {
  status: "success";
  data: T;
}
interface ErrorEnvelope {
  status: "error";
  code: string;
  message: string;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>
): Promise<T> {
  let url = path;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError("NETWORK_ERROR", "네트워크 오류가 발생했습니다.", 0);
  }

  let json: SuccessEnvelope<T> | ErrorEnvelope | null = null;
  try {
    json = (await res.json()) as SuccessEnvelope<T> | ErrorEnvelope;
  } catch {
    /* 본문 없음(예: 204) */
  }

  if (!res.ok || (json && json.status === "error")) {
    const err = json && json.status === "error" ? json : null;
    throw new ApiClientError(
      err?.code ?? "INTERNAL_ERROR",
      err?.message ?? `요청 실패 (${res.status})`,
      res.status
    );
  }
  return (json as SuccessEnvelope<T> | null)?.data as T;
}

/* ── 타입 ── */
export type Role = "parent" | "family" | "admin";

export interface MeData {
  userId: string;
  phone: string;
  role: Role;
  locationSharing: boolean;
  locationConsentAt: string | null;
  locationInterval: number;
  groupId: string | null;
  groupName: string | null;
  createdAt: string;
}
export interface LoginData {
  userId: string;
  phone: string;
  role: Role;
  locationSharing: boolean;
  groupId: string | null;
}
export interface CreateGroupData {
  groupId: string;
  groupName: string;
  inviteCode: string;
  qrCodeUrl: string;
  memberCount: number;
  createdAt: string;
}
export interface JoinGroupData {
  groupId: string;
  groupName: string;
  memberCount: number;
  role: string;
}
export interface CurrentLocationData {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  locationSharing: boolean;
  timestamp: string;
}
export interface HistoryData {
  date: string;
  totalPoints: number;
  sampled: boolean;
  locations: { locationId: string; latitude: number; longitude: number; accuracy: number; timestamp: string }[];
}
export interface SosResultData {
  sosEventId: string;
  sentAt: string;
  notifiedCount: number;
  failedCount: number;
}
export interface ChatMessage {
  messageId: string;
  senderId: string;
  content: string;
  sentAt: string;
}
export interface ChatPage {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}
export interface Geofence {
  geofenceId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  createdAt: string;
}
export interface AdminGroupRow {
  groupId: string;
  groupName: string;
  memberCount: number;
  createdAt: string;
  lastActiveAt: string | null;
}
export interface AdminGroupsData {
  total: number;
  page: number;
  perPage: number;
  groups: AdminGroupRow[];
}
export interface AdminGroupDetail {
  groupId: string;
  groupName: string;
  createdAt: string;
  members: {
    userId: string;
    phone: string;
    role: Role;
    locationSharing: boolean;
    lastSeenAt: string | null;
  }[];
}
export interface StatsData {
  period: string;
  from: string;
  to: string;
  summary: { totalDau: number; totalGroups: number; totalSosEvents: number };
  series: { date: string; dau: number; newGroups: number; sosEvents: number }[];
}

/* ── 엔드포인트 ── */
export const api = {
  // 인증
  register: (b: {
    phone: string;
    role: Role;
    termsAgreed: boolean;
    privacyAgreed: boolean;
    googleEmail?: string;
    googleName?: string;
    googlePicture?: string;
  }) =>
    request<{ userId: string; phone: string; role: Role; createdAt: string }>("POST", "/api/auth/register", b),
  login: (b: { phone: string }) => request<LoginData>("POST", "/api/auth/login", b),
  googleLogin: (b: { idToken?: string; accessToken?: string; email: string; name?: string; picture?: string }) =>
    request<LoginData>("POST", "/api/auth/google", b),
  logout: () => request<null>("POST", "/api/auth/logout"),
  me: () => request<MeData>("GET", "/api/auth/me"),

  // 그룹
  createGroup: (b: { groupName: string }) => request<CreateGroupData>("POST", "/api/groups", b),
  joinGroup: (b: { inviteCode: string }) => request<JoinGroupData>("POST", "/api/groups/join", b),

  // 위치
  saveConsent: (b: { locationConsentRequired: boolean; marketingConsent?: boolean; consentVersion: string }) =>
    request<{ consentId: string; locationConsentAt: string }>("POST", "/api/location/consent", b),
  revokeConsent: () => request<{ revokedAt: string; notifiedMembers: number }>("DELETE", "/api/location/consent"),
  sendLocation: (b: { latitude: number; longitude: number; accuracy: number; timestamp: string }) =>
    request<{ locationId: string; savedAt: string }>("POST", "/api/location", b),
  setSharing: (b: { locationSharing: boolean }) =>
    request<{ locationSharing: boolean; updatedAt: string; notifiedMembers: number }>(
      "PATCH",
      "/api/users/me/location-sharing",
      b
    ),
  currentLocation: (groupId: string) =>
    request<CurrentLocationData>("GET", `/api/location/current/${groupId}`),
  history: (groupId: string, date: string) =>
    request<HistoryData>("GET", "/api/location/history", undefined, { groupId, date }),
  address: (lat: number, lng: number) =>
    request<{ roadAddress: string; jibunAddress: string; cached: boolean }>("GET", "/api/location/address", undefined, {
      lat,
      lng,
    }),
  setSettings: (b: { locationInterval?: number }) =>
    request<{ locationInterval: number; updatedAt: string }>("PATCH", "/api/users/me/settings", b),

  // SOS / 채팅
  sendSos: (b: { latitude?: number; longitude?: number }) => request<SosResultData>("POST", "/api/sos", b),
  sosHistory: (groupId: string, limit?: number) =>
    request<{ total: number; events: { sosEventId: string; latitude: number | null; longitude: number | null; sentAt: string; notifiedCount: number }[] }>(
      "GET",
      "/api/sos/history",
      undefined,
      { groupId, limit }
    ),
  chatMessages: (groupId: string, opts?: { before?: string; limit?: number }) =>
    request<ChatPage>("GET", `/api/chat/${groupId}/messages`, undefined, {
      before: opts?.before,
      limit: opts?.limit,
    }),
  sendChat: (groupId: string, b: { content: string }) =>
    request<ChatMessage>("POST", `/api/chat/${groupId}/messages`, b),

  // 안전 구역
  createGeofence: (b: { groupId: string; name: string; latitude: number; longitude: number; radius: number }) =>
    request<Geofence>("POST", "/api/geofence", b),
  updateGeofence: (id: string, b: Partial<{ name: string; latitude: number; longitude: number; radius: number }>) =>
    request<Geofence>("PUT", `/api/geofence/${id}`, b),
  deleteGeofence: (id: string) => request<{ deletedAt: string }>("DELETE", `/api/geofence/${id}`),
  listGeofences: (groupId: string) => request<{ geofences: Geofence[] }>("GET", `/api/geofence/${groupId}`),

  // 관리자
  adminGroups: (q?: { search?: string; sort?: string; order?: string; page?: number }) =>
    request<AdminGroupsData>("GET", "/api/admin/groups", undefined, q),
  adminGroupDetail: (id: string) => request<AdminGroupDetail>("GET", `/api/admin/groups/${id}`),
  adminSms: (b: { recipients: string[]; content: string }) =>
    request<{ messageType: string; totalCount: number; successCount: number; failCount: number; sentAt: string }>(
      "POST",
      "/api/admin/sms",
      b
    ),
  adminAlimtalk: (b: { recipients: string[]; templateCode: string; variables?: Record<string, unknown> }) =>
    request<{ totalCount: number; successCount: number; failCount: number; sentAt: string }>(
      "POST",
      "/api/admin/alimtalk",
      b
    ),
  adminStats: (q: { type: string; period: string; from?: string; to?: string }) =>
    request<StatsData>("GET", "/api/admin/stats", undefined, q),
};
