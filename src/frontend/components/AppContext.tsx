"use client";
// AppContext.tsx — 데모 상태 저장소 + 라우터(플로우 전환) 컨텍스트
// 데이터 연동 방식: 데모 데이터 (UI 우선). 추후 API 라우트로 교체 가능.
import * as React from "react";

export type Route =
  | "login"
  | "onboarding"
  | "group"
  | "parent"
  | "parent-settings"
  | "parent-chat"
  | "family"
  | "family-history"
  | "family-chat"
  | "family-geofence"
  | "family-settings"
  | "admin";

export type ToastTone = "default" | "danger" | "success";
export interface ToastObj {
  msg: string;
  tone: ToastTone;
}

// "demo" = 가짜 데이터(로그인 없이 둘러보기), "live" = 실제 API 세션
export type AppMode = "demo" | "live";

export interface DemoState {
  role: "parent" | "family" | "admin";
  phone?: string;
  locationSharing: boolean;
  consentRevoked?: boolean;
  permDenied?: boolean;
  batterySaver?: boolean;
  onboarded: boolean;
  onboardingStep: number;
  inviteCode?: string;
  groupName?: string;
  groupCode?: string;
  groupCreated?: boolean;
  joined?: boolean;
  // ── live 모드 세션(실제 API 로그인 후 채워짐) ──
  mode?: AppMode;
  userId?: string;
  groupId?: string | null;
  locationConsentAt?: string | null;
  locationInterval?: number;
  // 구글 계정 연동 정보
  googleUser?: {
    email: string;
    name?: string;
    emoji?: string;
    picture?: string;
  } | null;
}

interface AppCtxValue {
  route: Route;
  nav: (to: Route, dir?: "left" | "right") => void;
  state: DemoState;
  set: (patch: Partial<DemoState>) => void;
  reset: (next?: Partial<DemoState>) => void; // 전체 상태 교체(로그인/로그아웃·플로우 전환)
  toast: (msg: string, tone?: ToastTone) => void;
}

export const AppCtx = React.createContext<AppCtxValue | null>(null);

export function useApp(): AppCtxValue {
  const ctx = React.useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppCtx.Provider");
  return ctx;
}

export const INITIAL_STATE: DemoState = {
  role: "parent",
  locationSharing: true,
  onboarded: true,
  onboardingStep: 1,
  mode: "demo",
  groupId: null,
};
