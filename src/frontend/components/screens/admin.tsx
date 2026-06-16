"use client";
// admin.tsx — SCR-010 회원/그룹, SCR-011 SMS/알림톡, SCR-012 통계 (PC 웹 어드민)
import * as React from "react";
import { useApp } from "../AppContext";
import { api, ApiClientError } from "../../lib/apiClient";
import { BrandMark, Card, Pill } from "../ui";
import { Icon, IconName } from "../Icon";

const { useState } = React;

type GroupStatus = "on" | "off" | "revoked";
interface AdminGroup {
  id: string;
  name: string;
  created: string;
  owner: string;
  parent: string;
  status: GroupStatus;
  members: number;
  last: string;
}

const ADMIN_GROUPS: AdminGroup[] = [
  { id: "G-0102", name: "마포구 홍길동가", created: "2026-05-30", owner: "홍재민", parent: "홍길순 어르신", status: "on", members: 4, last: "3초 전" },
  { id: "G-0089", name: "양천구 이정우가", created: "2026-05-28", owner: "이경우", parent: "김순희 어르신", status: "off", members: 3, last: "2시간 전" },
  { id: "G-0045", name: "서대문구 박가네", created: "2026-05-25", owner: "박진희", parent: "박용식 어르신", status: "revoked", members: 2, last: "3일 전" },
  { id: "G-0033", name: "강서구 김철수가", created: "2026-05-22", owner: "김민지", parent: "김말순 어르신", status: "on", members: 5, last: "1분 전" },
  { id: "G-0021", name: "은평구 정가네", created: "2026-05-19", owner: "정수아", parent: "정복동 어르신", status: "on", members: 3, last: "12분 전" },
  { id: "G-0014", name: "노원구 최정훈가", created: "2026-05-15", owner: "최정훈", parent: "최영자 어르신", status: "off", members: 4, last: "5시간 전" },
];
const STATUS_MAP: Record<GroupStatus, { tone: "on" | "off" | "danger"; label: string }> = {
  on: { tone: "on", label: "ON" },
  off: { tone: "off", label: "OFF" },
  revoked: { tone: "danger", label: "동의철회" },
};

export function AdminApp({ initialTab = "groups" }: { initialTab?: "groups" | "sms" | "stats" }) {
  const { nav } = useApp();
  const [tab, setTab] = useState<"groups" | "sms" | "stats">(initialTab);
  const tabs: [typeof tab, string, IconName][] = [
    ["groups", "회원 및 그룹 관리", "users"],
    ["sms", "SMS/알림톡 발송", "message"],
    ["stats", "통계 대시보드", "chart"],
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--g50)", fontSize: 14 }}>
      {/* top header */}
      <div
        style={{
          height: 64,
          background: "var(--brand-dark)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 28,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandMark size={32} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>
            안심맵 <span style={{ fontWeight: 500, opacity: 0.7 }}>관리자</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {tabs.map(([k, label, icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 40,
                padding: "0 16px",
                borderRadius: 8,
                color: tab === k ? "#fff" : "rgba(255,255,255,.65)",
                background: tab === k ? "rgba(255,255,255,.16)" : "transparent",
                fontWeight: 700,
                fontSize: 14,
                transition: "all .15s",
              }}
            >
              <Icon name={icon} size={18} color={tab === k ? "#fff" : "rgba(255,255,255,.65)"} stroke={2} /> {label}
            </button>
          ))}
        </div>
        <button
          className="press"
          onClick={() => nav("login", "left")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            color: "rgba(255,255,255,.8)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <Icon name="logout" size={18} color="rgba(255,255,255,.8)" stroke={2} /> 로그아웃
        </button>
      </div>
      {/* content */}
      <div className="scroll-y" style={{ flex: 1, padding: 28 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {tab === "groups" && <AdminGroups />}
          {tab === "sms" && <AdminSms />}
          {tab === "stats" && <AdminStats />}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          color: "var(--g900)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 4, height: 20, background: "var(--brand)", borderRadius: 2 }} />
        {children}
      </h2>
      {right}
    </div>
  );
}

/* ════════════════════ SCR-010 회원 및 그룹 목록 ════════════════════ */
function AdminGroups() {
  const { state, toast } = useApp();
  const live = state.mode === "live";
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"latest" | "members">("latest");
  const [sel, setSel] = useState<AdminGroup | null>(null);
  const [liveRows, setLiveRows] = useState<AdminGroup[] | null>(null);

  // live 모드: 서버 그룹 목록 조회 (검색·정렬 반영, F-022)
  React.useEffect(() => {
    if (!live) return;
    let alive = true;
    api
      .adminGroups({
        search: q || undefined,
        sort: sort === "members" ? "memberCount" : "createdAt",
        order: "desc",
        page: 1,
      })
      .then((res) => {
        if (!alive) return;
        // API 행을 데모 테이블 행 형태로 매핑 (owner/parent/status 는 서버 미제공 → 상세에서 조회)
        setLiveRows(
          res.groups.map((g) => ({
            id: g.groupId,
            name: g.groupName,
            created: g.createdAt.slice(0, 10),
            owner: "—",
            parent: "—",
            status: "on" as GroupStatus,
            members: g.memberCount,
            last: g.lastActiveAt ? new Date(g.lastActiveAt).toLocaleString("ko-KR") : "—",
          }))
        );
      })
      .catch((e) => {
        if (alive) toast(e instanceof ApiClientError ? e.message : "그룹 목록 조회 실패", "danger");
      });
    return () => {
      alive = false;
    };
  }, [live, q, sort, toast]);

  let rows = live
    ? liveRows ?? []
    : ADMIN_GROUPS.filter((g) => !q || g.name.includes(q) || g.owner.includes(q) || g.parent.includes(q));
  if (!live && sort === "members") rows = [...rows].sort((a, b) => b.members - a.members);

  // 상세 모달: live 모드면 서버에서 구성원 상세 조회
  const openDetail = async (g: AdminGroup) => {
    setSel(g);
    if (!live) return;
    try {
      const detail = await api.adminGroupDetail(g.id);
      const parent = detail.members.find((m) => m.role === "parent");
      setSel({
        ...g,
        owner: detail.members.find((m) => m.role === "family")?.phone ?? "—",
        parent: parent ? parent.phone : "—",
        status: parent ? (parent.locationSharing ? "on" : "off") : "off",
        members: detail.members.length,
      });
    } catch {
      /* 상세 조회 실패 시 목록 행 그대로 표시 */
    }
  };

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--g500)",
    textTransform: "uppercase",
    letterSpacing: ".04em",
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: 14,
    color: "var(--g800)",
    borderTop: "1px solid var(--g100)",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      <SectionTitle
        right={
          <div style={{ display: "flex", gap: 10 }}>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as never)}
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 8,
                border: "1.5px solid var(--g200)",
                fontWeight: 600,
                color: "var(--g700)",
                background: "#fff",
              }}
            >
              <option value="latest">최신 생성일순</option>
              <option value="members">구성원 수순</option>
            </select>
            <button
              className="press"
              onClick={() => toast("엑셀 파일을 다운로드합니다.")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: 40,
                padding: "0 16px",
                borderRadius: 8,
                background: "var(--brand)",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              <Icon name="download" size={18} color="#fff" stroke={2} /> 엑셀 다운로드
            </button>
          </div>
        }
      >
        그룹 및 회원 통합 목록
      </SectionTitle>

      <div style={{ position: "relative", maxWidth: 420, marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 14, top: 11 }}>
          <Icon name="search" size={20} color="var(--g400)" stroke={2} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="그룹명·자녀·부모님 검색"
          style={{
            width: "100%",
            height: 42,
            padding: "0 14px 0 44px",
            borderRadius: 8,
            border: "1.5px solid var(--g200)",
            outline: "none",
            fontSize: 14,
          }}
        />
      </div>

      <Card pad={0} style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--g50)" }}>
            <tr>
              <th style={th}>그룹 ID</th>
              <th style={th}>그룹명</th>
              <th style={th}>생성일</th>
              <th style={th}>소유주(자녀)</th>
              <th style={th}>부모님(상태)</th>
              <th style={th}>구성원</th>
              <th style={th}>마지막 연결</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const s = STATUS_MAP[g.status];
              return (
                <tr
                  key={g.id}
                  className="press"
                  onClick={() => openDetail(g)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-light)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <td style={{ ...td, fontFamily: "var(--mono)", fontWeight: 700, color: "var(--brand-dark)" }}>
                    {g.id}
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{g.name}</td>
                  <td style={td}>{g.created}</td>
                  <td style={td}>{g.owner}</td>
                  <td style={td}>
                    <span style={{ marginRight: 8 }}>{g.parent}</span>
                    <Pill tone={s.tone} dot>
                      {s.label}
                    </Pill>
                  </td>
                  <td style={td}>{g.members}명</td>
                  <td
                    style={{
                      ...td,
                      color: g.last.includes("초") || g.last.includes("분") ? "var(--brand)" : "var(--g500)",
                      fontWeight: 600,
                    }}
                  >
                    {g.last}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
        {["«", "1", "2", "3", "4", "5", "»"].map((p, i) => (
          <button
            key={i}
            style={{
              minWidth: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid var(--g200)",
              fontWeight: 700,
              background: p === "2" ? "var(--brand)" : "#fff",
              color: p === "2" ? "#fff" : "var(--g600)",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* detail modal */}
      {sel && (
        <div
          className="animate-dim-in"
          onClick={() => setSel(null)}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 300,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 440, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
          >
            <div
              style={{
                padding: "20px 24px",
                background: "var(--brand-dark)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, opacity: 0.7 }}>{sel.id}</div>
                <div style={{ fontSize: 19, fontWeight: 800 }}>{sel.name}</div>
              </div>
              <button onClick={() => setSel(null)}>
                <Icon name="close" size={24} color="#fff" stroke={2} />
              </button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              {(
                [
                  ["소유주(자녀)", sel.owner],
                  ["부모님", sel.parent],
                  ["생성일", sel.created],
                  ["구성원 수", `${sel.members}명`],
                  ["마지막 연결", sel.last],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--g100)",
                    paddingBottom: 12,
                  }}
                >
                  <span style={{ color: "var(--g500)", fontWeight: 600 }}>{k}</span>
                  <span style={{ color: "var(--g900)", fontWeight: 700 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "var(--g500)", fontWeight: 600 }}>위치 공유 상태</span>
                <Pill tone={STATUS_MAP[sel.status].tone} dot>
                  {STATUS_MAP[sel.status].label}
                </Pill>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ SCR-011 SMS / 알림톡 발송 ════════════════════ */
function AdminSms() {
  const { state, toast } = useApp();
  const live = state.mode === "live";
  const [channel, setChannel] = useState<"sms" | "alimtalk">("sms");
  // 상용에서는 더미 수신번호를 미리 채우지 않는다 (데모 모드에서만 예시 제공)
  const [recipients, setRecipients] = useState(live ? "" : "010-1234-5678, 010-9876-5432");
  const [msg, setMsg] = useState(
    live ? "" : "[안심맵 긴급 공지]\n금일 새벽 서버 정기 점검이 예정되어 있어 일시적으로 서비스 이용이 제한될 수 있습니다."
  );
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const count = msg.length;
  const isLms = count > 90;
  const recipientList = recipients
    .split(",")
    .map((s) => s.trim().replace(/\D/g, ""))
    .filter(Boolean);
  const nRecipients = recipientList.length;

  // live 모드: 실제 발송 (관리자 권한 필요). demo: 토스트만
  const doSend = async () => {
    setConfirm(false);
    if (!live) {
      toast(`${nRecipients}명에게 메시지를 발송했습니다.`);
      return;
    }
    setBusy(true);
    try {
      if (channel === "sms") {
        const r = await api.adminSms({ recipients: recipientList, content: msg });
        toast(`${r.messageType} ${r.successCount}건 발송 완료.`, "success");
      } else {
        const r = await api.adminAlimtalk({ recipients: recipientList, templateCode: "ANSIM_NOTICE" });
        toast(`알림톡 ${r.successCount}건 발송 완료.`, "success");
      }
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "발송에 실패했습니다.", "danger");
    } finally {
      setBusy(false);
    }
  };

  const channels: [typeof channel, string, IconName][] = [
    ["sms", "일반 SMS / LMS 문자메시지", "message"],
    ["alimtalk", "카카오 알림톡 (비즈 채널 템플릿)", "bell"],
  ];

  return (
    <div>
      <SectionTitle>긴급 대고객 메시지 발송 시스템</SectionTitle>

      <Card pad={24} style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: "var(--g700)", marginBottom: 12 }}>발송 채널</div>
        <div style={{ display: "flex", gap: 12 }}>
          {channels.map(([k, l, ic]) => (
            <button
              key={k}
              onClick={() => setChannel(k)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 18px",
                borderRadius: 12,
                border: `2px solid ${channel === k ? "var(--brand)" : "var(--g200)"}`,
                background: channel === k ? "var(--brand-light)" : "#fff",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  border: `2px solid ${channel === k ? "var(--brand)" : "var(--g300)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {channel === k && <span style={{ width: 11, height: 11, borderRadius: 999, background: "var(--brand)" }} />}
              </span>
              <Icon name={ic} size={20} color={channel === k ? "var(--brand-dark)" : "var(--g500)"} stroke={2} />
              <span style={{ fontWeight: 700, color: channel === k ? "var(--brand-dark)" : "var(--g700)" }}>{l}</span>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card pad={24}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: "var(--g700)" }}>수신 대상 번호 (쉼표 구분)</span>
            <Pill tone="info">{nRecipients}명</Pill>
          </div>
          <textarea
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="010-1234-5678, 010-9876-5432"
            style={{
              width: "100%",
              height: 220,
              padding: 14,
              borderRadius: 10,
              border: "1.5px solid var(--g200)",
              outline: "none",
              resize: "none",
              fontFamily: "var(--mono)",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          />
        </Card>
        <Card pad={24}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: "var(--g700)" }}>메시지 작성 내용</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: isLms ? "var(--danger)" : "var(--g500)" }}>
              {count} / 90자 {isLms ? "· LMS 자동 전환" : "· 단문 SMS"}
            </span>
          </div>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            style={{
              width: "100%",
              height: 220,
              padding: 14,
              borderRadius: 10,
              border: "1.5px solid var(--g200)",
              outline: "none",
              resize: "none",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          />
        </Card>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="press"
          disabled={!nRecipients || !msg.trim()}
          onClick={() => setConfirm(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 48,
            padding: "0 32px",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 16,
            background: !nRecipients || !msg.trim() ? "var(--g300)" : "var(--brand)",
            color: "#fff",
            cursor: !nRecipients || !msg.trim() ? "not-allowed" : "pointer",
          }}
        >
          <Icon name="send" size={20} color="#fff" stroke={2} /> 즉시 메시지 발송
        </button>
      </div>

      {confirm && (
        <div
          className="animate-dim-in"
          onClick={() => setConfirm(false)}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 300,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 400,
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,.3)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                background: "var(--brand-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="send" size={26} color="var(--brand)" stroke={2} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--g900)" }}>총 {nRecipients}명에게 발송할까요?</div>
            <p style={{ margin: 0, color: "var(--g600)", lineHeight: 1.5 }}>
              {channel === "sms" ? (isLms ? "LMS" : "SMS") : "카카오 알림톡"} 채널로 즉시 발송됩니다. 발송 후 취소할 수 없습니다.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirm(false)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 8,
                  border: "1.5px solid var(--g300)",
                  fontWeight: 700,
                  color: "var(--g700)",
                  background: "#fff",
                }}
              >
                취소
              </button>
              <button
                onClick={doSend}
                disabled={busy}
                style={{ flex: 1, height: 44, borderRadius: 8, fontWeight: 700, color: "#fff", background: "var(--brand)" }}
              >
                {busy ? "발송 중…" : "발송하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ SCR-012 통계 대시보드 ════════════════════ */
const DEMO_DAU = [2100, 2400, 3100, 3000, 3600, 4200, 4890];
const DEMO_LABELS = ["05-01", "05-07", "05-14", "05-21", "05-25", "05-28", "05-31"];

function AdminStats() {
  const { state, toast } = useApp();
  const live = state.mode === "live";
  const [hover, setHover] = useState<number | null>(null);
  const [liveStats, setLiveStats] = useState<{
    dau: number[];
    labels: string[];
    summary: { totalDau: number; totalGroups: number; totalSosEvents: number };
  } | null>(null);

  // live 모드: 운영 통계 조회 (F-026)
  React.useEffect(() => {
    if (!live) return;
    let alive = true;
    api
      .adminStats({ type: "all", period: "day" })
      .then((res) => {
        if (!alive) return;
        const series = res.series ?? [];
        setLiveStats({
          dau: series.map((s) => s.newGroups + s.sosEvents),
          labels: series.map((s) => s.date.slice(5)),
          summary: res.summary,
        });
      })
      .catch((e) => {
        if (alive) toast(e instanceof ApiClientError ? e.message : "통계 조회 실패", "danger");
      });
    return () => {
      alive = false;
    };
  }, [live, toast]);

  const dau = live ? liveStats?.dau ?? [] : DEMO_DAU;
  const labels = live ? liveStats?.labels ?? [] : DEMO_LABELS;
  const max = Math.max(1000, ...dau) * 1.1;
  const W = 1000;
  const H = 280;
  const pad = 40;
  const xs = (i: number) => pad + (i / Math.max(1, dau.length - 1)) * (W - pad * 2);
  const ys = (v: number) => H - pad - (v / max) * (H - pad * 1.4);
  const pts = dau.map((v, i) => `${xs(i)},${ys(v)}`).join(" ");

  const fmt = (n: number) => n.toLocaleString("ko-KR");
  const metrics: { icon: IconName; label: string; value: string; unit: string; tone: string }[] = live
    ? [
        { icon: "users", label: "기간 내 활성 사용자 (DAU)", value: fmt(liveStats?.summary.totalDau ?? 0), unit: "명", tone: "var(--brand)" },
        { icon: "sos", label: "누적 SOS 호출 수", value: fmt(liveStats?.summary.totalSosEvents ?? 0), unit: "건", tone: "var(--danger)" },
        { icon: "heart", label: "생성된 가족 그룹 수", value: fmt(liveStats?.summary.totalGroups ?? 0), unit: "개", tone: "var(--info)" },
      ]
    : [
        { icon: "users", label: "일일 활성 사용자 (DAU)", value: "4,890", unit: "명", tone: "var(--brand)" },
        { icon: "sos", label: "누적 SOS 호출 수", value: "24", unit: "건", tone: "var(--danger)" },
        { icon: "heart", label: "생성된 가족 그룹 수", value: "1,250", unit: "개", tone: "var(--info)" },
      ];

  return (
    <div>
      <SectionTitle
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 600, color: "var(--g600)", fontSize: 14 }}>조회 기간</span>
            <span
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--g200)",
                background: "#fff",
                fontWeight: 600,
                fontFamily: "var(--mono)",
                fontSize: 13,
              }}
            >
              2026-05-01 ~ 2026-05-31
            </span>
            <button
              className="press"
              onClick={() => toast("CSV 파일을 다운로드합니다.")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: 40,
                padding: "0 16px",
                borderRadius: 8,
                background: "var(--brand)",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              <Icon name="download" size={18} color="#fff" stroke={2} /> CSV 다운로드
            </button>
          </div>
        }
      >
        안심맵 서비스 운영 통계
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 24 }}>
        {metrics.map((m) => (
          <Card key={m.label} pad={24} style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: m.tone + "1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={m.icon} size={28} color={m.tone} stroke={2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--g500)", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--g900)" }}>
                {m.value}
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--g500)", marginLeft: 4 }}>{m.unit}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card pad={24}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: "var(--g900)",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="chart" size={20} color="var(--brand)" stroke={2} /> 일별 활성 사용자(DAU) 추이
        </div>
        <div style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
            <defs>
              <linearGradient id="dauFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((i) => {
              const v = (max / 4) * (4 - i);
              const y = ys(v);
              const labelText = v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`;
              return (
                <g key={i}>
                  <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="var(--g200)" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={pad - 8} y={y + 4} textAnchor="end" fontSize="13" fill="var(--g400)" fontFamily="var(--mono)">
                    {labelText}
                  </text>
                </g>
              );
            })}
            <polygon points={`${pad},${H - pad} ${pts} ${W - pad},${H - pad}`} fill="url(#dauFill)" />
            <polyline points={pts} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {dau.map((v, i) => (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                <circle cx={xs(i)} cy={ys(v)} r="12" fill="transparent" />
                <circle cx={xs(i)} cy={ys(v)} r={hover === i ? 7 : 5} fill="#fff" stroke="var(--brand)" strokeWidth="3" />
                <text x={xs(i)} y={H - pad + 22} textAnchor="middle" fontSize="13" fill="var(--g500)" fontFamily="var(--mono)">
                  {labels[i]}
                </text>
                {hover === i && (
                  <g>
                    <rect x={xs(i) - 36} y={ys(v) - 42} width="72" height="30" rx="6" fill="var(--g900)" />
                    <text x={xs(i)} y={ys(v) - 22} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">
                      {v.toLocaleString()}명
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
      </Card>
    </div>
  );
}
