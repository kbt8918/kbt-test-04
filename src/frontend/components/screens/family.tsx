"use client";
// family.tsx — SCR-006 지도, SCR-007 이력, SCR-008 채팅, SCR-009 안전구역
import * as React from "react";
import { useApp } from "../AppContext";
import { api, ApiClientError, type GroupMemberItem } from "../../lib/apiClient";
import { FakeMap, MapDot } from "../FakeMap";
import { MapView, type GeoPoint } from "../MapView";
import { Icon } from "../Icon";
import {
  Avatar,
  Banner,
  BottomNav,
  BottomSheet,
  Btn,
  Card,
  Field,
  IconBtn,
  MobileHeader,
  Pill,
  Toggle,
} from "../ui";

const { useState, useEffect, useRef } = React;

/* 멤버 표시 라벨: "이름 (호칭)" / "이름" / "호칭" / 폴백 */
function memberLabel(m: { name: string | null; relation: string | null }, fallback = "부모님"): string {
  const name = m.name?.trim();
  const rel = m.relation?.trim();
  if (name && rel) return `${name} (${rel})`;
  if (name) return name;
  if (rel) return rel;
  return fallback;
}

/* ──────── 다중 부모님 위치 표시 모델 (데모/실서버 공용) ──────── */
interface ParentLoc {
  userId: string;
  label: string;
  emoji: string;
  sharing: boolean;
  address: string | null;
  battery?: number;
  updatedText?: string;
  coord?: GeoPoint | null;
  marker: { x: number; y: number };
}

// 플랜별 위치 확인 가능 부모님 수 (Free 2명 / Pro 무제한). 백엔드 PLAN_PARENT_LIMIT 와 일치
const FREE_PARENT_LIMIT = 2;

// FakeMap(스타일맵)용 부모님 마커 분산 좌표 (실좌표 없을 때)
const PARENT_SPREAD = [
  { x: 44, y: 36 },
  { x: 62, y: 54 },
  { x: 32, y: 58 },
  { x: 68, y: 30 },
  { x: 50, y: 72 },
];

// 데모 모드: 기본 2명 동시 확인을 보여주기 위한 가짜 부모님 데이터
const DEMO_PARENTS: ParentLoc[] = [
  {
    userId: "demo-mom",
    label: "홍길순 (어머니)",
    emoji: "👵",
    sharing: true,
    address: "서울시 마포구 창전동 12-4",
    battery: 78,
    updatedText: "30초 전 갱신",
    marker: PARENT_SPREAD[0],
  },
  {
    userId: "demo-dad",
    label: "홍판석 (아버지)",
    emoji: "👴",
    sharing: true,
    address: "서울시 마포구 서교동 45-2",
    battery: 64,
    updatedText: "1분 전 갱신",
    marker: PARENT_SPREAD[1],
  },
  {
    userId: "demo-grandma",
    label: "박순자 (할머니)",
    emoji: "👵",
    sharing: true,
    address: "서울시 마포구 합정동 33-7",
    battery: 91,
    updatedText: "2분 전 갱신",
    marker: PARENT_SPREAD[2],
  },
];

/** ISO 시각 → "N초/분/시간 전 갱신" 상대 표기 */
function relTime(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return undefined;
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}초 전 갱신`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전 갱신`;
  return `${Math.floor(m / 60)}시간 전 갱신`;
}

/** 부모님 1명 위치 카드 (가로 스크롤 항목) */
function ParentCard({ p, selected, onClick }: { p: ParentLoc; selected?: boolean; onClick?: () => void }) {
  const showMeta = p.sharing && (p.battery != null || !!p.updatedText);
  return (
    <button
      data-parent-id={p.userId}
      onClick={onClick}
      style={{
        flex: "0 0 calc(86% - 5px)",
        scrollSnapAlign: "start",
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
      }}
      className="press"
    >
      <Card
        pad={16}
        style={{
          border: selected ? "2.5px solid var(--brand)" : "none",
          transition: "border-color 150ms, box-shadow 150ms",
          boxShadow: selected ? "0 0 0 3px rgba(46,125,50,.1)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: showMeta ? 10 : 0 }}>
          <Avatar emoji={p.emoji} size={44} ring={p.sharing ? "var(--brand)" : "var(--g400)"} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="t-h3"
              style={{ color: "var(--g900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {p.label}
            </div>
            {p.sharing ? (
              <div
                className="t-body-sm"
                style={{ color: "var(--g600)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}
              >
                <Icon name="mapPin" size={15} color="var(--brand)" stroke={2} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.address ?? "위치 확인 중…"}
                </span>
              </div>
            ) : (
              <div className="t-body-sm" style={{ color: "var(--g500)", marginTop: 2 }}>
                위치 공유가 꺼져 있어요
              </div>
            )}
          </div>
          <Pill tone={p.sharing ? "on" : "off"} dot>
            {p.sharing ? "실시간" : "꺼짐"}
          </Pill>
        </div>
        {showMeta && (
          <div style={{ display: "flex", gap: 8 }}>
            {p.battery != null && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 10px",
                  background: "var(--g50)",
                  borderRadius: 10,
                }}
              >
                <Icon name="battery" size={16} color="var(--brand)" stroke={2} />
                <span className="t-body-sm" style={{ color: "var(--g700)", fontWeight: 600 }}>
                  배터리 {p.battery}%
                </span>
              </div>
            )}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 10px",
                background: "var(--g50)",
                borderRadius: 10,
              }}
            >
              <Icon name="clock" size={16} color="var(--g500)" stroke={2} />
              <span className="t-body-sm" style={{ color: "var(--g700)", fontWeight: 600 }}>
                {p.updatedText ?? "방금 갱신"}
              </span>
            </div>
          </div>
        )}
      </Card>
    </button>
  );
}

/** Pro 업그레이드 유도 카드 (Free 플랜 한도 안내) */
function UpsellCard({ hidden, onUpgrade }: { hidden: number; onUpgrade: () => void }) {
  return (
    <div style={{ flex: "0 0 calc(80% - 5px)", scrollSnapAlign: "start" }}>
      <Card pad={16} style={{ background: "var(--brand-light)", border: "1.5px solid var(--brand)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="shield" size={22} color="var(--brand)" stroke={2} />
          </div>
          <div className="t-h3" style={{ color: "var(--brand-dark)" }}>
            Pro 플랜
          </div>
        </div>
        <p className="t-body-sm" style={{ color: "var(--g700)", lineHeight: 1.5, marginBottom: 12 }}>
          {hidden > 0
            ? `Pro로 업그레이드하면 나머지 부모님 ${hidden}명도 모두 확인할 수 있어요.`
            : "Pro 플랜은 부모님을 원하는 만큼 추가해 동시에 확인할 수 있어요."}
        </p>
        <Btn icon="shieldCheck" onClick={onUpgrade}>
          Pro 업그레이드
        </Btn>
      </Card>
    </div>
  );
}

/* ════════════════════ SCR-006 가족 메인 (실시간 지도) ════════════════════ */
export function FamilyMap() {
  const { state, nav, toast } = useApp();
  const live = state.mode === "live" && !!state.groupId;
  const groupId = state.groupId ?? "";
  const [sosOpen, setSosOpen] = useState(false);
  const [calling, setCalling] = useState(false);
  const [liveParents, setLiveParents] = useState<ParentLoc[] | null>(null);
  const [planLimit, setPlanLimit] = useState<number | null>(FREE_PARENT_LIMIT);
  const [totalParents, setTotalParents] = useState(0);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // live 모드: 플랜 한도 내 부모님 전체 현재 위치 + 주소 조회 (F-005, F-011, F-013)
  useEffect(() => {
    if (!live) return;
    let alive = true;
    api
      .currentLocations(groupId)
      .then(async (res) => {
        if (!alive) return;
        setPlanLimit(res.planLimit);
        setTotalParents(res.totalParents);
        const base: ParentLoc[] = res.parents.map((p, i) => ({
          userId: p.userId,
          label: memberLabel({ name: p.name, relation: p.relation }),
          emoji: "👵",
          sharing: p.locationSharing && p.latitude != null && p.longitude != null,
          address: null,
          updatedText: relTime(p.timestamp),
          coord: p.latitude != null && p.longitude != null ? { lat: p.latitude, lng: p.longitude } : null,
          marker: PARENT_SPREAD[i % PARENT_SPREAD.length],
        }));
        setLiveParents(base);
        // 첫 번째 부모님 기본 선택
        if (base.length > 0 && !selectedParentId) {
          setSelectedParentId(base[0].userId);
        }
        // 부모님별 주소 역지오코딩 (실패는 무시)
        const withAddr = await Promise.all(
          base.map(async (p) => {
            if (!p.coord) return p;
            try {
              const addr = await api.address(p.coord.lat, p.coord.lng);
              return { ...p, address: addr.roadAddress || addr.jibunAddress };
            } catch {
              return p;
            }
          })
        );
        if (alive) setLiveParents(withAddr);
      })
      .catch(() => {
        if (alive) {
          setLiveParents([]);
          setTotalParents(0);
        }
      });
    return () => {
      alive = false;
    };
  }, [live, groupId]);

  const parents: ParentLoc[] = live ? liveParents ?? [] : DEMO_PARENTS;
  const effLimit = live ? planLimit : FREE_PARENT_LIMIT;
  const effTotal = live ? totalParents : DEMO_PARENTS.length;
  const hiddenCount = effLimit == null ? 0 : Math.max(0, effTotal - effLimit);
  const anySharing = parents.some((p) => p.sharing);
  const loading = live && liveParents === null;

  // 카카오맵용 실좌표 마커 (공유 중인 부모님 전체)
  const geoMarkers = parents
    .filter((p) => p.coord && p.sharing)
    .map((p) => ({ ...(p.coord as GeoPoint), emoji: p.emoji, label: p.label, color: "var(--brand)" }));

  // 선택된 부모님의 위치정보
  const selectedParent = selectedParentId ? parents.find((p) => p.userId === selectedParentId) : null;
  // 지도: 등록된 부모님 전체를 동시에 표시. 선택된 부모님만 강조(active) 처리한다.
  const focusMarkers = parents.map((p) => ({
    x: p.marker.x,
    y: p.marker.y,
    emoji: p.emoji,
    label: p.label,
    color: "var(--brand)",
    active: selectedParentId ? p.userId === selectedParentId : true,
    stale: !p.sharing,
  }));
  // 카카오맵용: 공유 중인 부모님 전체를 동시에 표시
  const focusGeoMarkers = geoMarkers;
  // 지도 중심: 선택된 부모님 우선, 없으면 첫 공유 부모님
  const focusCenter =
    (selectedParent && selectedParent.coord && selectedParent.sharing
      ? selectedParent.coord
      : geoMarkers[0]) ?? undefined;

  // 데모 모드: 첫 번째 부모님 기본 선택
  React.useEffect(() => {
    if (!live && !selectedParentId && parents.length > 0) {
      setSelectedParentId(parents[0].userId);
    }
  }, [live, selectedParentId, parents]);

  // 선택된 부모님으로 자동 스크롤 + 지도 포커스
  React.useEffect(() => {
    if (!selectedParentId || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const selectedBtn = container.querySelector(`[data-parent-id="${selectedParentId}"]`) as HTMLElement;
    if (selectedBtn) {
      selectedBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedParentId]);

  return (
    <div
      style={{
        height: "100%",
        background: "var(--g100)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <MobileHeader brand right={<IconBtn name="settings" onClick={() => nav("family-settings", "right")} />} />

      <div style={{ flex: 1, position: "relative" }}>
        <MapView
          markers={focusMarkers}
          dim={!anySharing}
          grey={!anySharing}
          geoMarkers={focusGeoMarkers.length ? focusGeoMarkers : undefined}
          geoCenter={focusCenter}
        />

        {/* off banner — 공유 중인 부모님이 한 명도 없을 때 */}
        {!loading && parents.length > 0 && !anySharing && (
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 50 }}>
            <Banner tone="grey" icon="mapPin">
              부모님이 위치 공유를 꺼두셨습니다.
            </Banner>
          </div>
        )}

        {/* geofence shortcut */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 45,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <button
            className="press"
            onClick={() => nav("family-geofence", "right")}
            title="안전 구역"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="shield" size={22} color="var(--brand)" stroke={2} />
          </button>
        </div>

        {/* demo SOS trigger — 상용(live)에서는 노출하지 않음 (실제 SOS 는 푸시/실시간 수신) */}
        {!live && (
          <button
            className="press"
            onClick={() => setSosOpen(true)}
            style={{
              position: "absolute",
              left: 14,
              bottom: 210,
              zIndex: 45,
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 40,
              padding: "0 14px",
              borderRadius: 999,
              background: "var(--danger)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "calc(13px*var(--fz))",
              boxShadow: "0 4px 12px rgba(211,47,47,.4)",
            }}
          >
            <Icon name="sos" size={18} color="#fff" stroke={2.4} /> SOS 수신 미리보기
          </button>
        )}

        {/* parent location cards — 다중 부모님 가로 스크롤 */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, zIndex: 45, maxHeight: 220 }}>
          {/* 플랜·인원 안내 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px 8px" }}>
            <Icon name="users" size={14} color="#fff" stroke={2.2} />
            <span
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "calc(12px*var(--fz))",
                textShadow: "0 1px 4px rgba(0,0,0,.45)",
              }}
            >
              {effLimit == null
                ? `부모님 ${parents.length}명 확인 중 · Pro 무제한`
                : `부모님 ${parents.length}명 확인 중 · Free ${effLimit}명까지`}
            </span>
          </div>
          <div
            ref={scrollContainerRef}
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              overflowY: "hidden",
              padding: "0 12px 6px",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,.3) transparent",
              height: 170,
            }}
          >
            {loading ? (
              <div style={{ minWidth: "86%", scrollSnapAlign: "start" }}>
                <Card pad={16}>
                  <div className="t-body-sm" style={{ color: "var(--g500)" }}>
                    부모님 위치를 불러오는 중…
                  </div>
                </Card>
              </div>
            ) : parents.length === 0 ? (
              <div style={{ minWidth: "86%", scrollSnapAlign: "start" }}>
                <Card pad={16}>
                  <div className="t-body-sm" style={{ color: "var(--g500)" }}>
                    연결된 부모님이 없습니다. 가족 설정에서 부모님을 초대해 주세요.
                  </div>
                </Card>
              </div>
            ) : (
              parents.map((p) => (
                <ParentCard
                  key={p.userId}
                  p={p}
                  selected={selectedParentId === p.userId}
                  onClick={() => setSelectedParentId(p.userId)}
                />
              ))
            )}
            {!loading && effLimit != null && (
              <UpsellCard hidden={hiddenCount} onUpgrade={() => toast("Pro 플랜 안내 페이지로 이동합니다.")} />
            )}
          </div>
        </div>
      </div>

      <BottomNav active="family" onNav={(k) => nav(k as never, "right")} />

      {/* SOS receive modal */}
      {sosOpen && (
        <div
          className="animate-dim-in"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 600,
            background: "rgba(0,0,0,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 22,
          }}
        >
          <div
            className="animate-sheet-up"
            style={{ width: "100%", background: "#fff", borderRadius: 22, border: "2px solid var(--danger)", overflow: "hidden" }}
          >
            <div
              className="animate-flash-red"
              style={{
                background: "var(--danger)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: 1,
              }}
            >
              <Icon name="sos" size={28} color="#fff" stroke={2.4} />
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "calc(20px*var(--fz))" }}>
                SOS 긴급 상황 발생!!
              </span>
            </div>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar emoji="👵" size={52} ring="var(--danger)" />
                <div className="t-h2" style={{ color: "var(--g900)" }}>
                  홍길순 어르신이
                  <br />
                  도움을 요청하셨습니다!
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "12px 14px",
                  background: "var(--danger-light)",
                  borderRadius: 12,
                }}
              >
                <Icon name="mapPin" size={20} color="var(--danger)" stroke={2} />
                <span className="t-body" style={{ color: "var(--g800)", fontWeight: 600 }}>
                  서울시 마포구 창전동 12-4 창전현대아파트 앞
                </span>
              </div>
              <Btn variant="danger" size="lg" icon="phone" onClick={() => setCalling(true)}>
                전화로 직접 연결하기
              </Btn>
              <button
                className="press"
                onClick={() => setSosOpen(false)}
                style={{ color: "var(--g500)", fontWeight: 700, fontSize: "calc(15px*var(--fz))", padding: 8 }}
              >
                지도에서 위치 확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* fake call screen */}
      {calling && (
        <div
          className="animate-dim-in"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 700,
            background: "linear-gradient(160deg,#1B5E20,#0E3D12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "80px 32px 60px",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Avatar emoji="👵" size={110} />
            <div style={{ fontSize: "calc(26px*var(--fz))", fontWeight: 800 }}>홍길순 (어머니)</div>
            <div style={{ fontSize: "calc(16px*var(--fz))", opacity: 0.8 }}>연결 중…</div>
          </div>
          <button
            className="press"
            onClick={() => {
              setCalling(false);
              setSosOpen(false);
            }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: "var(--danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            }}
          >
            <Icon name="phone" size={32} color="#fff" stroke={2.4} style={{ transform: "rotate(135deg)" }} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ SCR-007 위치 이력 조회 ════════════════════ */
interface HistoryStop {
  t: string;
  label: string;
  tag: string;
  tone: "start" | "mid" | "end";
}
const HISTORY_DATA: Record<string, { path: { x: number; y: number }[]; stops: HistoryStop[] }> = {
  "2026-05-31": {
    path: [
      { x: 16, y: 30 },
      { x: 30, y: 34 },
      { x: 38, y: 50 },
      { x: 52, y: 56 },
      { x: 64, y: 62 },
      { x: 72, y: 74 },
    ],
    stops: [
      { t: "10:20", label: "마포구 신촌로 12", tag: "출발", tone: "start" },
      { t: "11:15", label: "창전동 현대아파트 앞", tag: "", tone: "mid" },
      { t: "12:00", label: "마포노인복지관", tag: "도착", tone: "end" },
    ],
  },
  "2026-05-30": {
    path: [
      { x: 70, y: 24 },
      { x: 56, y: 36 },
      { x: 44, y: 44 },
      { x: 30, y: 60 },
    ],
    stops: [
      { t: "08:40", label: "자택 (창전동 12-4)", tag: "출발", tone: "start" },
      { t: "09:30", label: "마포구청 사거리", tag: "", tone: "mid" },
      { t: "10:10", label: "서교동 행복마트", tag: "도착", tone: "end" },
    ],
  },
  "2026-05-29": { path: [], stops: [] },
};

interface DayData {
  path: { x: number; y: number }[];
  stops: HistoryStop[];
}

/** 실제 좌표 배열을 0~100 뷰포트로 정규화(여백 10%). 단일 점이면 중앙 배치 */
function projectPath(points: { latitude: number; longitude: number }[]): { x: number; y: number }[] {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1e-6;
  const spanLng = maxLng - minLng || 1e-6;
  const PAD = 12;
  return points.map((p) => ({
    // 경도→x, 위도→y(위가 북쪽이므로 반전)
    x: PAD + ((p.longitude - minLng) / spanLng) * (100 - PAD * 2),
    y: PAD + ((maxLat - p.latitude) / spanLat) * (100 - PAD * 2),
  }));
}

/** 최근 N일 날짜 문자열(YYYY-MM-DD) 목록 */
function recentDates(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i += 1) {
    const d = new Date(today.getTime() - i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function FamilyHistory() {
  const { state, nav, toast } = useApp();
  const live = state.mode === "live" && !!state.groupId;
  const groupId = state.groupId ?? "";
  const demoDates = Object.keys(HISTORY_DATA);
  const dates = live ? recentDates(7) : demoDates;
  const [date, setDate] = useState(dates[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [liveData, setLiveData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(false);
  const data: DayData = live ? liveData ?? { path: [], stops: [] } : HISTORY_DATA[date];
  const hasData = data.stops.length > 0;
  const toneColor: Record<string, string> = {
    start: "var(--brand)",
    mid: "var(--g500)",
    end: "var(--danger)",
  };

  // live 모드: 선택 날짜의 이력 조회 (F-012)
  useEffect(() => {
    if (!live) return;
    let alive = true;
    setLoading(true);
    setLiveData(null);
    api
      .history(groupId, date)
      .then((res) => {
        if (!alive) return;
        const path = projectPath(res.locations);
        const stops: HistoryStop[] = res.locations.map((loc, i) => {
          const isFirst = i === 0;
          const isLast = i === res.locations.length - 1;
          return {
            t: new Date(loc.timestamp).toTimeString().slice(0, 5),
            label: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
            tag: isFirst ? "출발" : isLast ? "도착" : "",
            tone: isFirst ? "start" : isLast ? "end" : "mid",
          };
        });
        // 점이 많으면 타임라인은 출발/중간/도착 3개로 축약
        const compact =
          stops.length > 6 ? [stops[0], stops[Math.floor(stops.length / 2)], stops[stops.length - 1]] : stops;
        setLiveData({ path, stops: compact });
      })
      .catch((e) => {
        if (!alive) return;
        setLiveData({ path: [], stops: [] });
        if (e instanceof ApiClientError && e.code !== "NOT_FOUND" && e.code !== "UNPROCESSABLE") {
          toast(e.message, "danger");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [live, groupId, date, toast]);

  return (
    <div style={{ height: "100%", background: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
      <MobileHeader title="이동 기록 조회" onBack={() => nav("family", "left")} />
      {/* date picker */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--g100)", position: "relative", zIndex: 30 }}>
        <button
          className="press"
          onClick={() => setPickerOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            height: 48,
            padding: "0 16px",
            borderRadius: 12,
            border: "1.5px solid var(--g200)",
            background: "#fff",
          }}
        >
          <Icon name="calendar" size={20} color="var(--brand)" stroke={2} />
          <span className="t-body-md" style={{ flex: 1, textAlign: "left", color: "var(--g900)" }}>
            {date.replace(/-/g, ". ")}
          </span>
          <Icon name="chevronDown" size={20} color="var(--g500)" />
        </button>
        {pickerOpen && (
          <div
            className="animate-dim-in"
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              top: 64,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,.15)",
              border: "1px solid var(--g200)",
              overflow: "hidden",
              zIndex: 40,
            }}
          >
            {dates.map((d) => (
              <button
                key={d}
                className="press"
                onClick={() => {
                  setDate(d);
                  setPickerOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "14px 16px",
                  background: d === date ? "var(--brand-light)" : "#fff",
                  borderBottom: "1px solid var(--g100)",
                }}
              >
                <span
                  className="t-body-md"
                  style={{ flex: 1, textAlign: "left", color: d === date ? "var(--brand-dark)" : "var(--g800)" }}
                >
                  {d.replace(/-/g, ". ")}
                </span>
                {!live && HISTORY_DATA[d].stops.length === 0 && (
                  <span className="t-caption" style={{ color: "var(--g400)" }}>
                    기록 없음
                  </span>
                )}
                {d === date && <Icon name="check" size={18} color="var(--brand)" stroke={2.5} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* map */}
      <div style={{ height: 240, position: "relative", flexShrink: 0, background: "var(--g100)" }}>
        {live && loading ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--g50)",
            }}
          >
            <span className="t-body-sm" style={{ color: "var(--g500)" }}>
              이동 기록을 불러오는 중…
            </span>
          </div>
        ) : hasData && data.path.length > 0 ? (
          <FakeMap path={data.path} showControls={false}>
            <MapDot x={data.path[0].x} y={data.path[0].y} color="var(--brand)" label="출발" />
            <MapDot
              x={data.path[data.path.length - 1].x}
              y={data.path[data.path.length - 1].y}
              color="var(--danger)"
              label="도착"
            />
          </FakeMap>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--g50)",
            }}
          >
            <Icon name="route" size={40} color="var(--g300)" stroke={1.6} />
          </div>
        )}
      </div>

      {/* timeline */}
      <div className="scroll-y" style={{ flex: 1, padding: "18px 20px" }}>
        <div className="t-overline" style={{ color: "var(--g500)", marginBottom: 14 }}>
          시간대별 이동 이력 · 최대 7일
        </div>
        {hasData ? (
          <div style={{ position: "relative", paddingLeft: 8 }}>
            {data.stops.map((s, i) => (
              <button
                key={i}
                className="press"
                onClick={() => toast(`${s.t} ${s.label} 위치로 이동합니다.`)}
                style={{
                  display: "flex",
                  gap: 14,
                  width: "100%",
                  textAlign: "left",
                  paddingBottom: i < data.stops.length - 1 ? 22 : 0,
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      background: toneColor[s.tone],
                      border: "3px solid #fff",
                      boxShadow: `0 0 0 2px ${toneColor[s.tone]}`,
                      zIndex: 2,
                    }}
                  />
                  {i < data.stops.length - 1 && (
                    <span style={{ width: 2, flex: 1, background: "var(--g200)", marginTop: 2 }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="mono t-body-sm" style={{ color: "var(--g500)", fontWeight: 700 }}>
                      {s.t}
                    </span>
                    {s.tag && <Pill tone={s.tone === "end" ? "danger" : "on"}>{s.tag}</Pill>}
                  </div>
                  <div className="t-body-md" style={{ color: "var(--g900)", marginTop: 3 }}>
                    {s.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <Icon name="calendar" size={48} color="var(--g300)" stroke={1.6} />
            <div className="t-h3" style={{ color: "var(--g600)" }}>
              이동 이력이 없습니다
            </div>
            <p className="t-body-sm" style={{ color: "var(--g500)", lineHeight: 1.5 }}>
              선택하신 날짜의 위치 이동 이력이 없습니다. 부모님 단말기 전원이나 네트워크 상태를 확인해 주세요.
            </p>
          </div>
        )}
      </div>

      <BottomNav active="family-history" onNav={(k) => nav(k as never, k === "family-history" ? "right" : "left")} />
    </div>
  );
}

/* ════════════════════ SCR-008 가족 채팅방 ════════════════════ */
interface ChatMsg {
  id: number | string;
  who: "me" | "mom" | "sis" | "other";
  name?: string;
  text: string;
  time: string;
  read?: boolean;
}
export function FamilyChat() {
  const { state, nav, toast } = useApp();
  const live = state.mode === "live" && !!state.groupId;
  const groupId = state.groupId ?? "";
  const myId = state.userId;
  // 상용(live)에서는 더미 메시지를 보여주지 않고 서버 메시지만 사용한다
  const [msgs, setMsgs] = useState<ChatMsg[]>(
    live
      ? []
      : [
          { id: 1, who: "mom", name: "어머니", text: "얘들아 나 복지관 도착했다. 걱정 마라.", time: "12:02" },
          { id: 2, who: "me", text: "네 확인했어요! 무리하지 마세요 🙏", time: "12:04", read: true },
          { id: 3, who: "sis", name: "여동생", text: "엄마 이따 저녁에 전화드릴게요~", time: "12:06" },
        ]
  );
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  // live 모드: 서버 메시지 로드
  useEffect(() => {
    if (!live) return;
    let alive = true;
    api
      .chatMessages(groupId, { limit: 50 })
      .then((page) => {
        if (!alive) return;
        setMsgs(
          page.messages.map((m) => ({
            id: m.messageId,
            who: m.senderId === myId ? "me" : "other",
            name: m.senderId === myId ? undefined : "가족",
            text: m.content,
            time: new Date(m.sentAt).toTimeString().slice(0, 5),
          }))
        );
      })
      .catch(() => {
        /* 로드 실패 시 데모 메시지 유지 */
      });
    return () => {
      alive = false;
    };
  }, [live, groupId, myId]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    if (live) {
      setText("");
      try {
        const m = await api.sendChat(groupId, { content: t });
        setMsgs((prev) => [
          ...prev,
          { id: m.messageId, who: "me", text: m.content, time: new Date(m.sentAt).toTimeString().slice(0, 5) },
        ]);
      } catch (e) {
        toast(e instanceof ApiClientError ? e.message : "전송 실패", "danger");
      }
      return;
    }
    setMsgs((m) => [
      ...m,
      { id: Date.now(), who: "me", text: t, time: new Date().toTimeString().slice(0, 5), read: false },
    ]);
    setText("");
  };

  const Bubble = ({ m }: { m: ChatMsg }) => {
    const mine = m.who === "me";
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: mine ? "flex-end" : "flex-start",
          marginBottom: 14,
        }}
      >
        {!mine && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: 4 }}>
            <Avatar emoji={m.who === "mom" ? "👵" : "🧑‍🦰"} size={24} />
            <span className="t-body-sm" style={{ color: "var(--g600)", fontWeight: 600 }}>
              {m.name}
            </span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            flexDirection: mine ? "row-reverse" : "row",
            maxWidth: "82%",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: mine ? "var(--brand)" : "#fff",
              color: mine ? "#fff" : "var(--g900)",
              border: mine ? "none" : "1px solid var(--g200)",
              fontSize: "calc(16px*var(--fz))",
              lineHeight: 1.45,
              wordBreak: "break-word",
            }}
          >
            {m.text}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
            {mine && m.read && (
              <span className="t-caption" style={{ color: "var(--brand)" }}>
                읽음
              </span>
            )}
            <span className="t-body-sm" style={{ color: "var(--g400)", fontSize: "calc(11px*var(--fz))" }}>
              {m.time}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: "100%", background: "var(--g50)", display: "flex", flexDirection: "column" }}>
      <MobileHeader title="가족 그룹 채팅방" sub={live ? undefined : "홍길순가 · 4명"} onBack={() => nav("family", "left")} />
      <div ref={scrollRef} className="scroll-y" style={{ flex: 1, padding: "16px 16px 8px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <span
            className="t-body-sm"
            style={{
              background: "rgba(0,0,0,.06)",
              color: "var(--g600)",
              padding: "4px 12px",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            2026년 5월 31일 일요일
          </span>
        </div>
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
      </div>
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--g200)",
          background: "#fff",
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="안부 메시지를 입력하세요"
          style={{
            flex: 1,
            height: 48,
            padding: "0 16px",
            borderRadius: 999,
            border: "1.5px solid var(--g200)",
            outline: "none",
            fontSize: "calc(16px*var(--fz))",
            background: "var(--g50)",
          }}
        />
        <button
          className="press"
          onClick={send}
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: text.trim() ? "var(--brand)" : "var(--g300)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background .15s",
          }}
        >
          <Icon name="send" size={22} color="#fff" stroke={2.2} />
        </button>
      </div>
      <BottomNav active="family-chat" onNav={(k) => nav(k as never, "left")} />
    </div>
  );
}

/* ════════════════════ SCR-009 안전 구역 설정 (지오펜싱) ════════════════════ */
export function FamilyGeofence() {
  const { state, nav, toast } = useApp();
  const live = state.mode === "live" && !!state.groupId;
  const groupId = state.groupId ?? "";
  const [center, setCenter] = useState({ x: 50, y: 42 });
  const [radius, setRadius] = useState(500);
  const [name, setName] = useState("마포 노인복지관");
  const [upsell, setUpsell] = useState(false);
  const [busy, setBusy] = useState(false);
  const rUnits = 3 + (radius / 5000) * 34;
  const fmtR = radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`;

  // 스타일맵 뷰포트(0~100)를 서울 인근 좌표로 매핑 (FakeMap 은 지리 정확 좌표가 아님)
  const viewportToLatLng = () => ({
    latitude: 37.5665 + (50 - center.y) * 0.0006,
    longitude: 126.978 + (center.x - 50) * 0.0008,
  });

  // live 모드 실제 저장
  const saveGeofence = async () => {
    if (!live) {
      toast("안전 구역이 저장되었습니다.", "success");
      setTimeout(() => nav("family", "left"), 500);
      return;
    }
    setBusy(true);
    try {
      const { latitude, longitude } = viewportToLatLng();
      await api.createGeofence({ groupId, name: name.trim(), latitude, longitude, radius });
      toast("안전 구역이 저장되었습니다.", "success");
      setTimeout(() => nav("family", "left"), 500);
    } catch (e) {
      // 플랜 한도 초과(422) 등은 메시지로 안내
      toast(e instanceof ApiClientError ? e.message : "저장에 실패했습니다.", "danger");
    } finally {
      setBusy(false);
    }
  };

  const onMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setCenter({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <div style={{ height: "100%", background: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
      <MobileHeader title="안전 구역 설정" onBack={() => nav("family", "left")} />
      <div style={{ height: 280, position: "relative", flexShrink: 0, cursor: "crosshair" }} onClick={onMapClick}>
        <FakeMap
          circle={{ x: center.x, y: center.y, r: rUnits, tone: "safe" }}
          markers={[{ x: center.x, y: center.y, emoji: "🏡", color: "var(--brand)" }]}
          showControls={false}
        />
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 50 }}>
          <Banner tone="info" icon="mapPin">
            지도를 눌러 중심 위치를 옮기세요
          </Banner>
        </div>
      </div>
      <div className="scroll-y" style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 22 }}>
        <Field label="구역 이름" value={name} onChange={setName} placeholder="예) 마포 노인복지관" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label className="t-h3" style={{ color: "var(--g800)" }}>
              반경 설정
            </label>
            <span
              className="mono"
              style={{ fontWeight: 800, color: "var(--brand-dark)", fontSize: "calc(18px*var(--fz))" }}
            >
              {fmtR}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={5000}
            step={50}
            value={radius}
            onChange={(e) => setRadius(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--brand)", height: 6 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="t-body-sm" style={{ color: "var(--g400)" }}>
              100m
            </span>
            <span className="t-body-sm" style={{ color: "var(--g400)" }}>
              5km
            </span>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 20px 34px", borderTop: "1px solid var(--g100)" }}>
        <Btn size="lg" disabled={!name.trim()} icon="shieldCheck" onClick={() => setUpsell(true)}>
          안전 구역 저장
        </Btn>
      </div>

      <BottomSheet open={upsell} onClose={() => setUpsell(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "var(--brand-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="shield" size={30} color="var(--brand)" stroke={2} />
          </div>
          <div className="t-h2" style={{ color: "var(--g900)" }}>
            Free 플랜은 안전 구역 1개까지
          </div>
          <p className="t-body" style={{ color: "var(--g600)", lineHeight: 1.5 }}>
            현재 Free 플랜에서는 안전 구역을 최대 1개까지만 등록할 수 있습니다. Pro 플랜으로 업그레이드하시겠습니까?
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn
              variant="outline"
              onClick={() => {
                setUpsell(false);
                void saveGeofence();
              }}
            >
              {busy ? "저장 중…" : "이대로 저장"}
            </Btn>
            <Btn
              onClick={() => {
                setUpsell(false);
                toast("Pro 플랜 안내 페이지로 이동합니다.");
              }}
            >
              Pro 업그레이드
            </Btn>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ════════════════════ SCR-010 가족 설정 ════════════════════ */
type UpdateInterval = "30s" | "1m" | "3m";

export function FamilySettings() {
  const { state, set, nav, toast } = useApp();
  const live = state.mode === "live" && !!state.groupId;
  const groupId = state.groupId ?? "";
  const [locationAlert, setLocationAlert] = useState(true);
  const [batteryAlert, setBatteryAlert] = useState(true);
  const [interval, setInterval] = useState<UpdateInterval>("30s");
  const [leaveOpen, setLeaveOpen] = useState(false);
  // live 모드 구성원 목록 + 호칭 편집
  const [members, setMembers] = useState<GroupMemberItem[]>([]);
  const [editTarget, setEditTarget] = useState<GroupMemberItem | null>(null);
  const [relationInput, setRelationInput] = useState("");
  const [savingRelation, setSavingRelation] = useState(false);
  // 구글 연동 해제 확인
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  // 회원가입 직후 랜딩 감지 (그룹 미설정 상태)
  const isNewUser = !state.groupId && state.role === "family";
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    if (!live) return;
    let alive = true;
    api
      .groupDetail(groupId)
      .then((d) => {
        if (alive) {
          console.log("[FamilySettings] groupDetail success:", d);
          setMembers(d.members);
          setInviteCode(d.inviteCode || "");
        }
      })
      .catch((err) => {
        console.error("[FamilySettings] groupDetail error:", err);
      });
    return () => {
      alive = false;
    };
  }, [live, groupId]);

  const openRelationEdit = (m: GroupMemberItem) => {
    setEditTarget(m);
    setRelationInput(m.relation ?? "");
  };

  const saveRelation = async () => {
    if (!editTarget) return;
    setSavingRelation(true);
    const relation = relationInput.trim() || null;
    try {
      await api.setMemberRelation(groupId, { userId: editTarget.userId, relation });
      setMembers((prev) =>
        prev.map((m) => (m.userId === editTarget.userId ? { ...m, relation } : m))
      );
      toast(relation ? `호칭을 '${relation}'(으)로 저장했어요.` : "호칭을 해제했어요.", "success");
      setEditTarget(null);
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "호칭 저장에 실패했습니다.", "danger");
    } finally {
      setSavingRelation(false);
    }
  };

  const copyInviteLink = () => {
    if (state.mode === "demo") {
      toast("데모 체험 중에는 초대 링크를 복사할 수 없습니다.", "danger");
      return;
    }
    if (!state.groupId) {
      toast("가족 그룹을 먼저 생성하거나 참여해주세요.", "danger");
      return;
    }
    if (!inviteCode) {
      toast("초대 코드를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "danger");
      return;
    }
    const link = `${window.location.origin}/join?code=${inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      toast("가족 초대 링크를 클립보드에 복사했습니다.", "success");
    }).catch(() => {
      toast("클립보드 복사에 실패했습니다.", "danger");
    });
  };

  const SectionLabel = ({ icon, label, danger }: { icon: string; label: string; danger?: boolean }) => (
    <div
      className="t-overline"
      style={{
        color: danger ? "var(--danger)" : "var(--g500)",
        padding: "0 4px 10px",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Icon name={icon} size={16} color={danger ? "var(--danger)" : "var(--g500)"} stroke={2} /> {label}
    </div>
  );

  const ToggleRow = ({
    icon,
    label,
    sub,
    on,
    onChange,
    locked,
  }: {
    icon: string;
    label: string;
    sub?: string;
    on?: boolean;
    onChange?: (v: boolean) => void;
    locked?: boolean;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: "#fff",
        borderBottom: "1px solid var(--g100)",
      }}
    >
      <Icon name={icon} size={20} color={locked ? "var(--g400)" : "var(--g600)"} stroke={2} />
      <div style={{ flex: 1 }}>
        <div className="t-body-md" style={{ color: locked ? "var(--g500)" : "var(--g900)" }}>
          {label}
        </div>
        {sub && (
          <div className="t-body-sm" style={{ color: "var(--g400)", marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {locked ? (
        <span
          className="t-caption"
          style={{ color: "var(--g500)", padding: "4px 10px", background: "var(--g100)", borderRadius: 6 }}
        >
          항상 켜짐
        </span>
      ) : (
        <Toggle on={!!on} onChange={onChange ?? (() => {})} />
      )}
    </div>
  );

  const ArrowRow = ({
    icon,
    label,
    right,
    onClick,
  }: {
    icon: string;
    label: string;
    right?: string;
    onClick: () => void;
  }) => (
    <button
      className="press"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "16px 16px",
        background: "#fff",
        borderBottom: "1px solid var(--g100)",
      }}
    >
      <Icon name={icon} size={20} color="var(--g600)" stroke={2} />
      <span className="t-body-md" style={{ color: "var(--g800)", flex: 1, textAlign: "left" }}>
        {label}
      </span>
      {right && (
        <span className="t-body-sm" style={{ color: "var(--g400)" }}>
          {right}
        </span>
      )}
      <Icon name="chevronRight" size={20} color="var(--g400)" />
    </button>
  );

  const INTERVALS: { value: UpdateInterval; label: string }[] = [
    { value: "30s", label: "30초" },
    { value: "1m", label: "1분" },
    { value: "3m", label: "3분 (절약)" },
  ];

  return (
    <div
      style={{
        height: "100%",
        background: "var(--g50)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <MobileHeader title="가족 설정" onBack={() => nav("family", "left")} />
      <div
        className="scroll-y"
        style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* 회원가입 직후 웰컴 배너 */}
        {isNewUser && (
          <div className="animate-slide-in">
            <Card pad={20} style={{ background: 'linear-gradient(135deg, var(--brand-light), #E8F5E9)', border: '2px solid var(--brand)', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(46,125,50,.15)', flexShrink: 0 }}>
                  <span style={{ fontSize: 28 }}>🎉</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="t-h3" style={{ color: 'var(--brand-dark)', fontWeight: 800 }}>가입을 환영합니다!</div>
                  <div className="t-body-sm" style={{ color: 'var(--g600)', marginTop: 4, lineHeight: 1.5 }}>
                    가족 그룹을 만들거나 참여해서 부모님의 위치를 확인하세요.
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <Btn size="lg" icon="plus" onClick={() => nav('group', 'right')}>
                  가족 그룹 설정하기
                </Btn>
              </div>
            </Card>
          </div>
        )}

        {/* 구글 계정 연동 */}
        <div>
          <SectionLabel icon="shieldCheck" label="계정 연동" />
          <Card pad={0} style={{ overflow: 'hidden' }}>
            {state.googleUser ? (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {state.googleUser.picture ? (
                    <img src={state.googleUser.picture} alt="" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, border: '2px solid var(--brand-light)' }} />
                  ) : (
                    <Avatar emoji={state.googleUser.emoji || '🧑‍💻'} size={44} ring="var(--brand)" />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span className="t-body-md" style={{ color: 'var(--g900)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {state.googleUser.email}
                      </span>
                    </div>
                    <div className="t-caption" style={{ color: 'var(--brand)', marginTop: 3, fontWeight: 600 }}>
                      Google 계정 연동됨
                    </div>
                  </div>
                  <Pill tone="on" dot>연동</Pill>
                </div>
                <div style={{ marginTop: 14, borderTop: '1px solid var(--g100)', paddingTop: 14 }}>
                  <button
                    className="press"
                    onClick={() => setUnlinkConfirmOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      width: '100%', height: 44, borderRadius: 10,
                      border: '1.5px solid var(--g200)', background: '#fff',
                      color: 'var(--g600)', fontWeight: 700, fontSize: 'calc(14px*var(--fz))',
                      transition: 'all .15s',
                    }}
                  >
                    <Icon name="logout" size={16} color="var(--g500)" stroke={2.2} />
                    구글 계정 연동 해제
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--g100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="t-body-md" style={{ color: 'var(--g800)', fontWeight: 600 }}>Google 계정 미연동</div>
                    <div className="t-body-sm" style={{ color: 'var(--g500)', marginTop: 2 }}>소셜 로그인으로 편리하게 접속하세요</div>
                  </div>
                  <Pill tone="off">미연동</Pill>
                </div>
                <Banner tone="grey" icon="bell">
                  Google 계정을 연동하면 소셜 로그인으로 간편하게 접속할 수 있어요.
                </Banner>
              </div>
            )}
          </Card>
        </div>

        {/* 가족 구성원 */}
        <div>
          <SectionLabel icon="users" label="가족 구성원" />
          <Card pad={0} style={{ overflow: "hidden" }}>
            {live ? (
              members.length === 0 ? (
                <div className="t-body-sm" style={{ color: "var(--g500)", padding: "16px" }}>
                  구성원을 불러오는 중…
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.userId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      borderBottom: "1px solid var(--g100)",
                    }}
                  >
                    <Avatar
                      emoji={m.isParent ? "👵" : "🧑"}
                      size={44}
                      ring={m.isParent ? "var(--brand)" : "var(--g300)"}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t-body-md" style={{ color: "var(--g900)", fontWeight: 600 }}>
                        {memberLabel(m, m.isParent ? "부모님" : "가족")}
                      </div>
                      <div className="t-body-sm" style={{ color: "var(--g500)", marginTop: 2 }}>
                        {m.isParent ? "부모님" : "가족"}
                        {m.userId === state.userId ? " · 나" : ""}
                        {" · "}
                        {m.locationSharing ? "위치 공유 중" : "공유 꺼짐"}
                      </div>
                    </div>
                    {m.isParent && (
                      <button
                        className="press"
                        onClick={() => openRelationEdit(m)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "var(--brand-light)",
                          color: "var(--brand-dark)",
                          fontWeight: 700,
                          fontSize: "calc(13px*var(--fz))",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="edit" size={14} color="var(--brand-dark)" stroke={2.2} />
                        {m.relation ? "호칭 변경" : "호칭 지정"}
                      </button>
                    )}
                  </div>
                ))
              )
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--g100)",
                }}
              >
                <Avatar emoji="👵" size={44} ring="var(--brand)" />
                <div style={{ flex: 1 }}>
                  <div className="t-body-md" style={{ color: "var(--g900)", fontWeight: 600 }}>
                    홍길순 <span style={{ color: "var(--g500)", fontWeight: 400 }}>(어머니)</span>
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--g500)", marginTop: 2 }}>
                    010-1234-5678 · 연결됨
                  </div>
                </div>
                <Pill tone="on" dot>
                  활성
                </Pill>
              </div>
            )}
            <button
              className="press"
              onClick={copyInviteLink}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "14px 16px",
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "var(--brand-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="plus" size={22} color="var(--brand)" stroke={2.4} />
              </div>
              <span className="t-body-md" style={{ color: "var(--brand-dark)", flex: 1, textAlign: "left" }}>
                가족 구성원 초대하기
              </span>
              <Icon name="chevronRight" size={20} color="var(--g400)" />
            </button>
          </Card>
        </div>

        {/* 알림 설정 */}
        <div>
          <SectionLabel icon="bell" label="알림 설정" />
          <Card pad={0} style={{ overflow: "hidden" }}>
            <ToggleRow icon="sos" label="SOS 긴급 알림" sub="수신 중단 불가" locked />
            <ToggleRow
              icon="mapPin"
              label="위치 갱신 알림"
              sub={locationAlert ? "이동 감지 시 즉시 알림" : "알림 꺼짐"}
              on={locationAlert}
              onChange={(v) => {
                setLocationAlert(v);
                toast(v ? "위치 갱신 알림을 켰어요." : "위치 갱신 알림을 껐어요.");
              }}
            />
            <ToggleRow
              icon="battery"
              label="배터리 부족 알림"
              sub={batteryAlert ? "20% 이하 시 알림" : "알림 꺼짐"}
              on={batteryAlert}
              onChange={(v) => {
                setBatteryAlert(v);
                toast(v ? "배터리 부족 알림을 켰어요." : "배터리 부족 알림을 껐어요.");
              }}
            />
          </Card>
        </div>

        {/* 위치 갱신 주기 */}
        <div>
          <SectionLabel icon="clock" label="위치 갱신 주기" />
          <Card pad={0} style={{ overflow: "hidden" }}>
            {INTERVALS.map((iv) => (
              <button
                key={iv.value}
                className="press"
                onClick={() => {
                  setInterval(iv.value);
                  toast(`위치 갱신 주기를 ${iv.label}로 변경했어요.`);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  padding: "14px 16px",
                  background: interval === iv.value ? "var(--brand-light)" : "#fff",
                  borderBottom: "1px solid var(--g100)",
                }}
              >
                <span
                  className="t-body-md"
                  style={{
                    flex: 1,
                    textAlign: "left",
                    color: interval === iv.value ? "var(--brand-dark)" : "var(--g800)",
                    fontWeight: interval === iv.value ? 700 : 500,
                  }}
                >
                  {iv.label}
                </span>
                {interval === iv.value && <Icon name="check" size={20} color="var(--brand)" stroke={2.5} />}
              </button>
            ))}
          </Card>
        </div>

        {/* 앱 정보 */}
        <div>
          <SectionLabel icon="doc" label="앱 정보" />
          <Card pad={0} style={{ overflow: "hidden" }}>
            <ArrowRow icon="doc" label="개인정보처리방침" onClick={() => toast("개인정보처리방침 페이지를 표시합니다.")} />
            <ArrowRow
              icon="mapPin"
              label="위치기반서비스 이용약관"
              onClick={() => toast("위치기반서비스 이용약관을 표시합니다.")}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 16px", background: "#fff" }}>
              <Icon name="shieldCheck" size={20} color="var(--g600)" stroke={2} />
              <span className="t-body-md" style={{ flex: 1, color: "var(--g800)" }}>
                앱 버전
              </span>
              <span className="t-body-sm" style={{ color: "var(--g400)" }}>
                v1.0.0
              </span>
            </div>
          </Card>
        </div>

        {/* 위험 구역 */}
        <div>
          <SectionLabel icon="alert" label="위험 구역" danger />
          <Card pad={18} style={{ border: "1.5px solid var(--danger-light)" }}>
            <p className="t-body" style={{ color: "var(--g700)", marginBottom: 14, lineHeight: 1.5 }}>
              그룹에서 나가면 부모님의 위치를 더 이상 확인할 수 없습니다.
            </p>
            <Btn variant="dangerGhost" icon="logout" onClick={() => setLeaveOpen(true)}>
              가족 그룹에서 나가기
            </Btn>
          </Card>
        </div>
      </div>

      {/* 구글 계정 연동 해제 확인 */}
      <BottomSheet open={unlinkConfirmOpen} onClose={() => setUnlinkConfirmOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 999, background: 'var(--g100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div className="t-h2" style={{ color: "var(--g900)" }}>
              구글 계정 연동을 해제할까요?
            </div>
          </div>
          <p className="t-body" style={{ color: "var(--g600)", lineHeight: 1.5 }}>
            연동을 해제하면 Google 계정으로 로그인할 수 없게 됩니다. 휴대폰 번호로만 로그인해야 합니다.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn variant="outline" onClick={() => setUnlinkConfirmOpen(false)}>
              취소
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                set({ googleUser: null });
                setUnlinkConfirmOpen(false);
                toast("구글 계정 연동이 해제되었습니다.", "danger");
              }}
            >
              연동 해제
            </Btn>
          </div>
        </div>
      </BottomSheet>

      {/* 호칭 지정/변경 */}
      <BottomSheet open={!!editTarget} onClose={() => setEditTarget(null)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="t-h2" style={{ color: "var(--g900)" }}>
            {editTarget?.name ? `${editTarget.name} 님` : "부모님"} 호칭 지정
          </div>
          <p className="t-body-sm" style={{ color: "var(--g600)", lineHeight: 1.5 }}>
            가족 화면에 표시될 호칭을 입력하세요. 예) 어머니, 아버지, 할머니. 비워두면 호칭이 해제됩니다.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["어머니", "아버지", "할머니", "할아버지"].map((preset) => (
              <button
                key={preset}
                className="press"
                onClick={() => setRelationInput(preset)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1.5px solid var(--g200)",
                  background: relationInput === preset ? "var(--brand-light)" : "#fff",
                  color: relationInput === preset ? "var(--brand-dark)" : "var(--g700)",
                  fontWeight: 600,
                  fontSize: "calc(14px*var(--fz))",
                }}
              >
                {preset}
              </button>
            ))}
          </div>
          <Field
            label="호칭"
            value={relationInput}
            onChange={(v) => setRelationInput(v.slice(0, 20))}
            placeholder="예) 어머니"
          />
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn variant="outline" onClick={() => setEditTarget(null)}>
              취소
            </Btn>
            <Btn disabled={savingRelation} onClick={() => void saveRelation()}>
              {savingRelation ? "저장 중…" : "저장"}
            </Btn>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={leaveOpen} onClose={() => setLeaveOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "var(--danger-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="alert" size={30} color="var(--danger)" stroke={2.2} />
          </div>
          <div className="t-h2" style={{ color: "var(--g900)" }}>
            정말 그룹에서 나가시겠어요?
          </div>
          <p className="t-body" style={{ color: "var(--g600)", lineHeight: 1.5 }}>
            그룹에서 나가면 부모님의 실시간 위치와 이동 기록을 더 이상 볼 수 없습니다. 다시 참여하려면 초대 링크가 필요합니다.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn variant="outline" onClick={() => setLeaveOpen(false)}>
              취소
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                setLeaveOpen(false);
                toast("가족 그룹에서 나갔습니다.", "danger");
                setTimeout(() => nav("login", "left"), 600);
              }}
            >
              나가기
            </Btn>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
