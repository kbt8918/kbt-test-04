"use client";
// parent.tsx — SCR-003 부모님 메인(SOS), SCR-004 부모님 설정
import * as React from "react";
import { useApp } from "../AppContext";
import { api, ApiClientError } from "../../lib/apiClient";
import { Icon, IconName } from "../Icon";
import {
  Avatar,
  Banner,
  BottomSheet,
  Btn,
  Card,
  IconBtn,
  MobileHeader,
  Toggle,
} from "../ui";

const { useState, useEffect, useRef } = React;

/* ════════════════════ SCR-003 부모님 메인 (SOS) ════════════════════ */
export function ParentMain() {
  const { state, set, nav, toast } = useApp();
  const [sos, setSos] = useState<"idle" | "counting" | "sent">("idle");
  const [count, setCount] = useState(2);
  const live = state.mode === "live";
  const sharing = state.locationSharing !== false && !state.consentRevoked;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sosSent = useRef(false);

  const startSos = () => {
    sosSent.current = false;
    setCount(2);
    setSos("counting");
  };
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    setSos("idle");
  };

  // live 모드: 카운트다운 완료 시 실제 SOS 발송 (현재 위치 포함, F-016)
  const fireSos = React.useCallback(() => {
    if (sosSent.current) return;
    sosSent.current = true;
    if (!live) return;
    const send = (lat?: number, lng?: number) =>
      api.sendSos({ latitude: lat, longitude: lng }).catch((e) => {
        toast(e instanceof ApiClientError ? e.message : "SOS 발송에 실패했습니다.", "danger");
      });
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => send(p.coords.latitude, p.coords.longitude),
        () => send(),
        { timeout: 4000 }
      );
    } else {
      send();
    }
  }, [live, toast]);

  useEffect(() => {
    if (sos !== "counting") return;
    if (count <= 0) {
      fireSos();
      setSos("sent");
      return;
    }
    timer.current = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [sos, count, fireSos]);

  useEffect(() => {
    if (sos === "sent") {
      const t = setTimeout(() => setSos("idle"), 3400);
      return () => clearTimeout(t);
    }
  }, [sos]);

  return (
    <div
      style={{
        height: "100%",
        background: "var(--g50)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <MobileHeader
        brand
        right={<IconBtn name="settings" onClick={() => nav("parent-settings", "right")} />}
      />

      <div
        className="scroll-y"
        style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 20px 0" }}
      >
        {/* iOS foreground keep banner */}
        <div style={{ marginBottom: 12 }}>
          <Banner tone="warn" icon="alert">
            화면을 켜두면 위치가 더 정확해요. 홈 화면에 추가하면 더 편리합니다.
          </Banner>
        </div>
        {state.permDenied && (
          <div style={{ marginBottom: 12 }}>
            <Banner
              tone="danger"
              icon="mapPin"
              action={
                <button
                  className="t-caption press"
                  onClick={() => toast("위치 권한 활성화 방법을 안내합니다.")}
                  style={{ color: "var(--danger)", fontWeight: 800, whiteSpace: "nowrap" }}
                >
                  방법 보기
                </button>
              }
            >
              위치 권한 꺼짐
            </Banner>
          </div>
        )}

        {/* status card */}
        <Card
          pad={18}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            border: sharing ? "1.5px solid var(--brand-light)" : "1.5px solid var(--g200)",
          }}
        >
          <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
            {sharing && (
              <span
                className="animate-ping-ring"
                style={{ position: "absolute", inset: 0, borderRadius: 999, background: "var(--brand)" }}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                background: sharing ? "var(--brand)" : "var(--g400)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="mapPin" size={24} color="#fff" stroke={2.2} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="t-h2" style={{ color: "var(--g900)" }}>
              {sharing ? "위치 전송 중" : "위치 공유 꺼짐"}
            </div>
            <div className="t-body-sm" style={{ color: "var(--g500)", marginTop: 2 }}>
              {sharing ? "가족이 내 위치를 보고 있어요" : "가족이 내 위치를 볼 수 없어요"}
            </div>
          </div>
        </Card>

        {/* 가족과 대화하기 (음성 채팅 진입) — 시니어용 큰 버튼 */}
        <button
          className="press"
          onClick={() => nav("parent-chat", "right")}
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: "100%",
            padding: "16px 18px",
            borderRadius: 16,
            background: "var(--brand)",
            border: "none",
            boxShadow: "0 4px 14px rgba(46,125,50,.28)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              background: "rgba(255,255,255,.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="mic" size={26} color="#fff" stroke={2.2} />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: "calc(19px*var(--fz))" }}>
              가족과 대화하기
            </div>
            <div style={{ color: "rgba(255,255,255,.85)", fontWeight: 500, fontSize: "calc(14px*var(--fz))", marginTop: 2 }}>
              말하면 글자로 보내드려요
            </div>
          </div>
          <Icon name="chevronRight" size={24} color="#fff" />
        </button>

        {/* SOS button */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            minHeight: 280,
          }}
        >
          <button
            className="press animate-sos-pulse"
            onClick={startSos}
            style={{
              width: 230,
              height: 230,
              borderRadius: 999,
              background: "radial-gradient(circle at 38% 32%, #FF5A52, var(--danger))",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: "#fff",
            }}
          >
            <Icon name="sos" size={64} color="#fff" stroke={2.4} />
            <span style={{ fontSize: "calc(34px*var(--fz))", fontWeight: 800, letterSpacing: ".04em" }}>
              SOS
            </span>
            <span style={{ fontSize: "calc(17px*var(--fz))", fontWeight: 700, opacity: 0.95 }}>
              긴급 호출
            </span>
          </button>
          <p
            className="t-h3"
            style={{ color: "var(--g500)", fontWeight: 500, textAlign: "center", maxWidth: 240 }}
          >
            위급할 때 버튼을 누르면 가족 모두에게 알림이 갑니다.
          </p>
        </div>
      </div>

      {/* location toggle */}
      <div
        style={{
          padding: "14px 20px 34px",
          borderTop: "1px solid var(--g200)",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="t-h3" style={{ color: "var(--g900)" }}>
            실시간 위치 공유
          </div>
          <div className="t-body-sm" style={{ color: "var(--g500)" }}>
            {sharing ? "켜짐 · 30초마다 전송" : "꺼짐"}
          </div>
        </div>
        <Toggle
          size="lg"
          on={sharing}
          onChange={async (v) => {
            if (state.consentRevoked) {
              toast("동의를 철회한 상태예요. 설정에서 다시 동의해 주세요.", "danger");
              return;
            }
            // 낙관적 업데이트 후 live 모드면 서버 반영
            set({ locationSharing: v });
            if (live) {
              try {
                await api.setSharing({ locationSharing: v });
              } catch (e) {
                set({ locationSharing: !v }); // 롤백
                toast(e instanceof ApiClientError ? e.message : "변경에 실패했습니다.", "danger");
                return;
              }
            }
            toast(
              v ? "위치 공유를 켰어요. 가족에게 알렸습니다." : "위치 공유를 껐어요. 가족에게 알렸습니다.",
              v ? "success" : "default"
            );
          }}
        />
      </div>

      {/* SOS countdown overlay */}
      {sos === "counting" && (
        <div
          className="animate-dim-in"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 500,
            background: "radial-gradient(circle at 50% 40%, #E53935, #B71C1C)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: 32,
          }}
        >
          <div
            style={{
              fontSize: "calc(28px*var(--fz))",
              fontWeight: 800,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            🚨 긴급 상황
          </div>
          <div
            className="animate-throb"
            style={{
              width: 180,
              height: 180,
              borderRadius: 999,
              background: "rgba(255,255,255,.16)",
              border: "4px solid rgba(255,255,255,.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "calc(110px*var(--fz))", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              {count}
            </span>
          </div>
          <p
            style={{
              fontSize: "calc(19px*var(--fz))",
              fontWeight: 600,
              color: "#fff",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            가족들에게 SOS 알림과
            <br />
            현재 위치를 전송합니다.
          </p>
          <button
            className="press"
            onClick={cancel}
            style={{
              marginTop: 8,
              height: 60,
              padding: "0 48px",
              borderRadius: 999,
              background: "#fff",
              color: "var(--danger)",
              fontSize: "calc(20px*var(--fz))",
              fontWeight: 800,
            }}
          >
            발송 취소
          </button>
        </div>
      )}

      {/* SOS sent */}
      {sos === "sent" && (
        <div
          className="animate-dim-in"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 500,
            background: "rgba(20,18,18,.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
            padding: 32,
          }}
        >
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 999,
              background: "rgba(76,175,80,.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="checkCircle" size={68} color="#69DB7C" stroke={2.2} />
          </div>
          <div style={{ fontSize: "calc(24px*var(--fz))", fontWeight: 800, color: "#fff", textAlign: "center" }}>
            가족에게 긴급 알림을
            <br />
            보냈습니다.
          </div>
          <p style={{ fontSize: "calc(16px*var(--fz))", color: "rgba(255,255,255,.7)", textAlign: "center" }}>
            📳 사이렌 진동이 울리고 있어요
          </p>
          <button
            className="press"
            onClick={() => setSos("idle")}
            style={{
              height: 56,
              padding: "0 40px",
              borderRadius: 12,
              background: "rgba(255,255,255,.15)",
              color: "#fff",
              fontSize: "calc(17px*var(--fz))",
              fontWeight: 700,
            }}
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ SCR-004 부모님 설정 ════════════════════ */
export function ParentSettings() {
  const { state, set, nav, toast } = useApp();
  const live = state.mode === "live";
  const [confirm, setConfirm] = useState(false);
  const battery = !!state.batterySaver;

  const Row = ({ icon, label, onClick }: { icon: IconName; label: string; onClick?: () => void }) => (
    <button
      className="press"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "16px",
        background: "#fff",
        borderBottom: "1px solid var(--g100)",
      }}
    >
      <Icon name={icon} size={22} color="var(--g600)" stroke={2} />
      <span className="t-body-md" style={{ color: "var(--g800)", flex: 1, textAlign: "left" }}>
        {label}
      </span>
      <Icon name="chevronRight" size={20} color="var(--g400)" />
    </button>
  );

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
      <MobileHeader title="설정" onBack={() => nav("parent", "left")} />
      <div
        className="scroll-y"
        style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* battery saver */}
        <div>
          <div
            className="t-overline"
            style={{ color: "var(--g500)", padding: "0 4px 10px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Icon name="battery" size={16} color="var(--g500)" stroke={2} /> 배터리 절약 모드
          </div>
          <Card pad={0}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
              <div style={{ flex: 1 }}>
                <div className="t-body-md" style={{ color: "var(--g900)" }}>
                  배터리 절약 모드 켜기
                </div>
                <div className="t-body-sm" style={{ color: "var(--g500)", marginTop: 2 }}>
                  위치 전송 주기가 3분으로 늘어납니다.
                </div>
              </div>
              <Toggle
                on={battery}
                onChange={async (v) => {
                  set({ batterySaver: v });
                  if (live) {
                    try {
                      // 배터리 절약 = 위치 전송 주기 180초, 일반 = 30초 (F-027)
                      await api.setSettings({ locationInterval: v ? 180 : 30 });
                    } catch (e) {
                      set({ batterySaver: !v });
                      toast(e instanceof ApiClientError ? e.message : "설정 변경 실패", "danger");
                      return;
                    }
                  }
                  toast(
                    v ? "배터리 절약 모드를 켰어요 (3분 주기)" : "배터리 절약 모드를 껐어요 (30초 주기)"
                  );
                }}
              />
            </div>
          </Card>
        </div>

        {/* legal */}
        <div>
          <div
            className="t-overline"
            style={{ color: "var(--g500)", padding: "0 4px 10px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Icon name="doc" size={16} color="var(--g500)" stroke={2} /> 법률 및 개인정보 보호
          </div>
          <Card pad={0} style={{ overflow: "hidden" }}>
            <Row icon="doc" label="개인정보처리방침 열람" onClick={() => toast("개인정보처리방침 페이지를 표시합니다.")} />
            <div style={{ marginBottom: -1 }}>
              <Row
                icon="mapPin"
                label="위치기반서비스 이용약관"
                onClick={() => toast("위치기반서비스 이용약관을 표시합니다.")}
              />
            </div>
          </Card>
        </div>

        {/* danger zone */}
        <div>
          <div
            className="t-overline"
            style={{ color: "var(--danger)", padding: "0 4px 10px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Icon name="alert" size={16} color="var(--danger)" stroke={2} /> 위험 구역
          </div>
          <Card pad={18} style={{ border: "1.5px solid var(--danger-light)" }}>
            <p className="t-body" style={{ color: "var(--g700)", marginBottom: 14, lineHeight: 1.5 }}>
              위치 정보 수집 동의를 철회하면 가족들이 더 이상 위치를 볼 수 없습니다.
            </p>
            <Btn variant="dangerGhost" icon="trash" onClick={() => setConfirm(true)}>
              위치 공유 동의 철회
            </Btn>
          </Card>
        </div>
      </div>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)}>
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
            정말 동의를 철회하시겠어요?
          </div>
          <p className="t-body" style={{ color: "var(--g600)", lineHeight: 1.5 }}>
            동의를 철회하면 가족들이 나의 위치를 전혀 볼 수 없습니다. 자녀들에게도 철회 사실이 알림으로 전송됩니다.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn variant="outline" onClick={() => setConfirm(false)}>
              취소
            </Btn>
            <Btn
              variant="danger"
              onClick={async () => {
                setConfirm(false);
                if (live) {
                  try {
                    await api.revokeConsent(); // F-008: 즉시 수집 중단 + 가족 알림
                  } catch (e) {
                    toast(e instanceof ApiClientError ? e.message : "철회에 실패했습니다.", "danger");
                    return;
                  }
                }
                set({ consentRevoked: true, locationSharing: false, onboardingStep: 3 });
                toast("위치 정보 제공 동의를 철회했습니다.", "danger");
                setTimeout(() => nav("onboarding", "left"), 600);
              }}
            >
              철회하기
            </Btn>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ════════════════════ SCR-014 부모님 음성 채팅 ════════════════════ */
interface ParentChatMsg {
  id: number | string;
  who: "me" | "family";
  name?: string;
  emoji?: string;
  text: string;
  time: string;
}

// 브라우저 SpeechRecognition 최소 타입 (Web Speech API)
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
}

export function ParentChat() {
  const { state, nav, toast } = useApp();
  const live = state.mode === "live" && !!state.groupId;
  const groupId = state.groupId ?? "";
  const myId = state.userId;

  const [msgs, setMsgs] = useState<ParentChatMsg[]>([
    { id: 1, who: "family", name: "큰딸", emoji: "🧑‍🦰", text: "엄마 점심 드셨어요?", time: "12:30" },
    { id: 2, who: "family", name: "아들", emoji: "🧑", text: "오늘 날씨 추우니 따뜻하게 입으세요!", time: "12:32" },
  ]);
  const [draft, setDraft] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 새 메시지/음성 인식 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, draft, interim]);

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
            who: m.senderId === myId ? "me" : "family",
            name: m.senderId === myId ? undefined : "가족",
            emoji: "🧑",
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

  // 음성인식(Web Speech API) 초기화 — 클라이언트 전용
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "ko-KR"; // 한국어 음성 인식
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText) setDraft((d) => (d ? `${d} ` : "") + finalText.trim());
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      setListening(false);
      setInterim("");
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        toast("마이크 사용을 허용해 주세요.", "danger");
        setShowKeyboard(true);
      } else if (e?.error === "no-speech") {
        toast("소리가 들리지 않았어요. 다시 말씀해 주세요.");
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
  }, [toast]);

  const toggleListening = () => {
    const rec = recRef.current;
    if (!rec) {
      setSupported(false);
      setShowKeyboard(true);
      toast("이 브라우저는 음성 입력을 지원하지 않아 글자판으로 입력해요.");
      return;
    }
    if (listening) {
      rec.stop();
      return;
    }
    setInterim("");
    try {
      rec.start();
    } catch {
      /* 중복 start 무시 */
    }
  };

  const send = async () => {
    const t = draft.trim();
    if (!t) return;
    if (listening) recRef.current?.stop();
    setDraft("");
    setInterim("");
    if (live) {
      try {
        const m = await api.sendChat(groupId, { content: t });
        setMsgs((prev) => [
          ...prev,
          { id: m.messageId, who: "me", text: m.content, time: new Date(m.sentAt).toTimeString().slice(0, 5) },
        ]);
      } catch (e) {
        toast(e instanceof ApiClientError ? e.message : "전송에 실패했어요.", "danger");
        setDraft(t); // 실패 시 복원
      }
      return;
    }
    setMsgs((prev) => [
      ...prev,
      { id: Date.now(), who: "me", text: t, time: new Date().toTimeString().slice(0, 5) },
    ]);
    toast("가족에게 보냈어요.", "success");
  };

  const Bubble = ({ m }: { m: ParentChatMsg }) => {
    const mine = m.who === "me";
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: mine ? "flex-end" : "flex-start",
          marginBottom: 16,
        }}
      >
        {!mine && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, paddingLeft: 4 }}>
            <Avatar emoji={m.emoji || "🧑"} size={28} />
            <span className="t-body-md" style={{ color: "var(--g600)", fontWeight: 700 }}>
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
            maxWidth: "84%",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: mine ? "var(--brand)" : "#fff",
              color: mine ? "#fff" : "var(--g900)",
              border: mine ? "none" : "1px solid var(--g200)",
              fontSize: "calc(19px*var(--fz))", // 시니어 가독성: 큰 글씨
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {m.text}
          </div>
          <span className="t-body-sm" style={{ color: "var(--g400)", fontSize: "calc(12px*var(--fz))" }}>
            {m.time}
          </span>
        </div>
      </div>
    );
  };

  const showDraftBar = !!(draft || interim);

  return (
    <div style={{ height: "100%", background: "var(--g50)", display: "flex", flexDirection: "column" }}>
      <MobileHeader title="가족과 대화하기" sub="말하면 글자로 보내드려요" onBack={() => nav("parent", "left")} />

      <div ref={scrollRef} className="scroll-y" style={{ flex: 1, padding: "16px 16px 8px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <span
            className="t-body-sm"
            style={{
              background: "rgba(0,0,0,.06)",
              color: "var(--g600)",
              padding: "5px 14px",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            오늘
          </span>
        </div>
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
      </div>

      {/* 입력 영역 — 음성이 주 기능 */}
      <div style={{ borderTop: "1px solid var(--g200)", background: "#fff", padding: "14px 16px 28px" }}>
        {/* 인식/작성 중인 내용 미리보기 */}
        {showDraftBar && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              marginBottom: 12,
              background: "var(--g50)",
              border: "1.5px solid var(--g200)",
              borderRadius: 14,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ color: "var(--g900)", fontSize: "calc(18px*var(--fz))", fontWeight: 600 }}>
                {draft}
              </span>
              {interim && (
                <span style={{ color: "var(--g400)", fontSize: "calc(18px*var(--fz))" }}> {interim}</span>
              )}
            </div>
            <button
              className="press"
              onClick={() => {
                setDraft("");
                setInterim("");
              }}
              aria-label="지우기"
              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <Icon name="close" size={22} color="var(--g500)" stroke={2.2} />
            </button>
          </div>
        )}

        {/* 글자판 입력 (보조 수단) */}
        {showKeyboard && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 500))}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="여기에 입력하세요"
              style={{
                flex: 1,
                height: 52,
                padding: "0 16px",
                borderRadius: 12,
                border: "1.5px solid var(--g300)",
                outline: "none",
                fontSize: "calc(18px*var(--fz))",
                background: "#fff",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 주 기능: 큰 음성 입력 버튼 */}
          <button
            className="press"
            onClick={toggleListening}
            style={{
              flex: 1,
              height: 72,
              borderRadius: 18,
              border: "none",
              background: listening ? "var(--danger)" : "var(--brand)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              boxShadow: listening
                ? "0 4px 16px rgba(211,47,47,.35)"
                : "0 4px 16px rgba(46,125,50,.3)",
              position: "relative",
            }}
          >
            <span style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
              {listening && (
                <span
                  className="animate-ping-ring"
                  style={{ position: "absolute", inset: 0, borderRadius: 999, background: "rgba(255,255,255,.5)" }}
                />
              )}
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="mic" size={26} color="#fff" stroke={2.2} />
              </span>
            </span>
            <span style={{ fontSize: "calc(21px*var(--fz))", fontWeight: 800 }}>
              {listening ? "듣고 있어요… (탭하면 멈춤)" : "눌러서 말하기"}
            </span>
          </button>

          {/* 보내기 버튼 — 작성된 내용이 있을 때 강조 */}
          <button
            className="press"
            onClick={send}
            disabled={!draft.trim()}
            aria-label="보내기"
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              flexShrink: 0,
              background: draft.trim() ? "var(--brand-dark)" : "var(--g200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background .15s",
            }}
          >
            <Icon name="send" size={28} color={draft.trim() ? "#fff" : "var(--g400)"} stroke={2.2} />
          </button>
        </div>

        {/* 글자판 전환 */}
        <button
          className="press"
          onClick={() => setShowKeyboard((s) => !s)}
          style={{
            marginTop: 12,
            width: "100%",
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--g600)",
            fontWeight: 600,
            fontSize: "calc(15px*var(--fz))",
          }}
        >
          <Icon name="keyboard" size={20} color="var(--g600)" stroke={2} />
          {showKeyboard ? "글자판 닫기" : "글자판으로 입력하기"}
        </button>

        {!supported && !showKeyboard && (
          <p className="t-body-sm" style={{ color: "var(--g500)", textAlign: "center", marginTop: 8 }}>
            이 브라우저는 음성 입력이 어려워요. 글자판으로 입력해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
