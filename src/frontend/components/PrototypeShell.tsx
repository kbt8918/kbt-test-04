"use client";
// PrototypeShell.tsx — 라우터·데모 스토어·프레임 전환·플로우 스위처
// 전체 화면 흐름.html (안심맵 클로드 디자인)을 Next.js로 재구현한 셸.
import * as React from "react";
import {
  AppCtx,
  INITIAL_STATE,
  Route,
  DemoState,
  ToastObj,
  ToastTone,
} from "./AppContext";
import { Icon, IconName } from "./Icon";
import { BrandMark, Toast } from "./ui";
import { ChromeWindow, FitStage, IOSDevice } from "./Frames";
import { LoginScreen, OnboardingScreen, GroupScreen } from "./screens/auth";
import { ParentMain, ParentSettings, ParentChat } from "./screens/parent";
import { FamilyMap, FamilyHistory, FamilyChat, FamilyGeofence, FamilySettings } from "./screens/family";
import { AdminApp } from "./screens/admin";

const { useState, useEffect, useCallback } = React;

interface Flow {
  key: string;
  label: string;
  icon: IconName;
  entry: Route;
  routes: Route[];
}
const FLOWS: Flow[] = [
  { key: "auth", label: "로그인·온보딩", icon: "user", entry: "login", routes: ["login", "onboarding", "group"] },
  { key: "parent", label: "부모님", icon: "sos", entry: "parent", routes: ["parent", "parent-settings", "parent-chat"] },
  { key: "family", label: "가족", icon: "mapPin", entry: "family", routes: ["family", "family-history", "family-chat", "family-geofence", "family-settings"] },
  { key: "admin", label: "관리자", icon: "chart", entry: "admin", routes: ["admin"] },
];
const ROUTE_NAMES: Record<Route, string> = {
  login: "SCR-001 로그인/회원가입",
  onboarding: "SCR-002 온보딩",
  group: "SCR-005 가족 그룹",
  parent: "SCR-003 부모님 메인 (SOS)",
  "parent-settings": "SCR-004 부모님 설정",
  "parent-chat": "SCR-014 부모님 음성 채팅",
  family: "SCR-006 실시간 지도",
  "family-history": "SCR-007 위치 이력",
  "family-chat": "SCR-008 가족 채팅",
  "family-geofence": "SCR-009 안전 구역",
  "family-settings": "SCR-010 가족 설정",
  admin: "SCR-011~013 관리자 어드민",
};

export function PrototypeShell({ initialInviteCode }: { initialInviteCode?: string }) {
  const [route, setRoute] = useState<Route>("login");
  const [dir, setDir] = useState<"left" | "right">("right");
  const [state, setState] = useState<DemoState>({
    ...INITIAL_STATE,
    pendingInviteCode: initialInviteCode,
  });
  const [toastObj, setToastObj] = useState<ToastObj | null>(null);

  const nav = useCallback((to: Route, d: "left" | "right" = "right") => {
    setDir(d);
    setRoute(to);
  }, []);
  const set = useCallback((patch: Partial<DemoState>) => setState((s) => ({ ...s, ...patch })), []);
  const reset = useCallback((next?: Partial<DemoState>) => setState({ ...INITIAL_STATE, ...next }), []);
  const toast = useCallback((msg: string, tone: ToastTone = "default") => {
    setToastObj({ msg, tone });
  }, []);

  useEffect(() => {
    if (!toastObj) return;
    const t = setTimeout(() => setToastObj(null), 2600);
    return () => clearTimeout(t);
  }, [toastObj]);

  const ctx = { route, nav, state, set, reset, toast };
  const isAdmin = route === "admin";
  const activeFlow = FLOWS.find((f) => f.routes.includes(route))?.key;

  const screen = (() => {
    switch (route) {
      case "login":
        return <LoginScreen />;
      case "onboarding":
        return <OnboardingScreen />;
      case "group":
        return <GroupScreen />;
      case "parent":
        return <ParentMain />;
      case "parent-settings":
        return <ParentSettings />;
      case "parent-chat":
        return <ParentChat />;
      case "family":
        return <FamilyMap />;
      case "family-history":
        return <FamilyHistory />;
      case "family-chat":
        return <FamilyChat />;
      case "family-geofence":
        return <FamilyGeofence />;
      case "family-settings":
        return <FamilySettings />;
      case "admin":
        return <AdminApp />;
      default:
        return <ParentMain />;
    }
  })();

  return (
    <AppCtx.Provider value={ctx}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg,#E9EAE6,#DCDED8)",
        }}
      >
        {/* top flow switcher */}
        <div
          style={{
            height: 64,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 24px",
            background: "rgba(255,255,255,.7)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(0,0,0,.06)",
            position: "sticky",
            top: 0,
            zIndex: 100,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <BrandMark size={30} />
            <span style={{ fontWeight: 800, color: "var(--brand-dark)", fontSize: 17 }}>안심맵</span>
            <span
              style={{
                fontSize: 12,
                color: "var(--g500)",
                fontWeight: 600,
                padding: "3px 8px",
                background: "var(--g100)",
                borderRadius: 6,
                marginLeft: 2,
              }}
            >
              프로토타입
            </span>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,.04)", borderRadius: 10, padding: 4 }}>
            {FLOWS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  // 플로우 탭 진입은 데모 모드로 리셋 (로그인 흐름에서만 live 전환)
                  reset();
                  nav(f.entry, "right");
                }}
                className="press"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 38,
                  padding: "0 14px",
                  borderRadius: 8,
                  background: activeFlow === f.key ? "#fff" : "transparent",
                  color: activeFlow === f.key ? "var(--brand-dark)" : "var(--g600)",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: activeFlow === f.key ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                  transition: "all .15s",
                }}
              >
                <Icon name={f.icon} size={17} color={activeFlow === f.key ? "var(--brand)" : "var(--g500)"} stroke={2} />{" "}
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          {state.mode === "live" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--brand-dark)",
                background: "var(--brand-light)",
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: "var(--brand)",
                }}
                className="animate-ping-ring"
              />
              실서버 연결됨
            </span>
          )}
          <span style={{ fontSize: 13, color: "var(--g500)", fontWeight: 600 }}>{ROUTE_NAMES[route]}</span>
        </div>

        {/* stage */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "32px 24px 48px",
          }}
        >
          {isAdmin ? (
            <FitStage w={1180} h={760}>
              <ChromeWindow width={1180} height={760} url="admin.ansimmap.kr/groups">
                <div style={{ position: "relative", height: "100%" }}>
                  {screen}
                  <Toast toast={toastObj} />
                </div>
              </ChromeWindow>
            </FitStage>
          ) : (
            <FitStage w={402} h={874}>
              <IOSDevice>
                <div
                  key={route}
                  className={dir === "right" ? "animate-slide-in" : ""}
                  style={{ height: "100%", position: "relative" }}
                >
                  {screen}
                </div>
                <Toast toast={toastObj} />
              </IOSDevice>
            </FitStage>
          )}
        </div>
      </div>
    </AppCtx.Provider>
  );
}
