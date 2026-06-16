"use client";
// auth.tsx — SCR-001 로그인/회원가입, SCR-002 온보딩, SCR-005 가족 그룹
import * as React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useApp } from "../AppContext";
import { api, ApiClientError } from "../../lib/apiClient";
import { DEMO_ENABLED } from "../../lib/env";
import { Icon } from "../Icon";
import {
  Banner,
  BottomSheet,
  BrandMark,
  Btn,
  Card,
  CheckRow,
  Field,
  MobileHeader,
  Pill,
  RadioGroup,
  TOP_INSET,
} from "../ui";

const { useState, useEffect } = React;

export function fmtPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/* fake QR matrix — stable pattern with 3 finder squares */
export function QrCode({ size = 132 }: { size?: number }) {
  const n = 21;
  const cell = size / n;
  const finder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const inFinder = (r: number, c: number) => {
    const blocks = [
      [0, 0],
      [0, n - 7],
      [n - 7, 0],
    ];
    return blocks.some(([br, bc]) => {
      const rr = r - br;
      const cc = c - bc;
      if (rr < 0 || rr > 6 || cc < 0 || cc > 6) return false;
      const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
      const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
      return edge || core;
    });
  };
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      let on = false;
      if (finder(r, c)) on = inFinder(r, c);
      else on = (r * 7 + c * 13 + r * c * 3) % 5 < 2;
      if (on)
        cells.push(
          <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#212121" />
        );
    }
  }
  return (
    <svg width={size} height={size} style={{ background: "#fff", borderRadius: 8 }}>
      {cells}
    </svg>
  );
}

/* ════════════════════ SCR-001 로그인 / 회원가입 ════════════════════ */
export function LoginScreen() {
  const { nav, set, reset, toast, state } = useApp();
  const [tab, setTab] = useState<"login" | "register">("register");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"parent" | "family">("parent");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phoneErr, setPhoneErr] = useState("");
  const [generalErr, setGeneralErr] = useState("");
  const valid = phone.replace(/\D/g, "").length >= 10 && (tab === "login" || agree);

  // 로그인/가입 성공 후 공통 랜딩 처리 로직
  const processLoginSuccess = async (data: any, isRegister: boolean = false) => {
    let finalGroupId = data.groupId;

    // 초대 코드가 있으면 자동 가입 진행
    if (state.pendingInviteCode) {
      try {
        const joinData = await api.joinGroup({ inviteCode: state.pendingInviteCode });
        finalGroupId = joinData.groupId;
        toast("가족 그룹에 성공적으로 참여되었습니다!", "success");
        set({ pendingInviteCode: undefined, groupId: finalGroupId });
      } catch (e) {
        toast("초대받은 그룹 참여에 실패했습니다. 유효하지 않은 코드일 수 있습니다.", "danger");
        set({ pendingInviteCode: undefined });
      }
    }

    if (data.role === "admin") {
      nav("admin", "right");
    } else if (data.role === "parent") {
      if (isRegister && !state.pendingInviteCode) {
        set({ onboardingStep: 1 });
        nav("onboarding", "right");
      } else {
        nav("parent", "right");
      }
    } else {
      if (!finalGroupId) {
        if (isRegister) toast('가입을 환영합니다! 가족 설정을 시작하세요.', 'success');
        nav("family-settings", "right");
      } else {
        if (!isRegister && !state.pendingInviteCode) toast('로그인이 완료되었습니다.', 'success');
        try {
          const groupInfo = await api.groupDetail(finalGroupId);
          const hasParent = groupInfo.members.some(m => m.isParent);
          if (hasParent) {
            nav("family", "right");
          } else {
            nav("family-settings", "right");
          }
        } catch (e) {
          nav("family", "right");
        }
      }
    }
  };

  // 탭 변경 시 에러 초기화
  const handleTabChange = (k: "login" | "register") => {
    setTab(k);
    setPhoneErr("");
    setGeneralErr("");
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setBusy(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const acc = {
          email: userInfo.email,
          name: userInfo.name,
          emoji: '🧑‍💻',
          picture: userInfo.picture,
        };

        // 구글 로그인/회원가입 동시 처리
        const data = await api.googleLogin({
          accessToken: tokenResponse.access_token,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        });

        reset({
          mode: "live",
          userId: data.userId,
          phone: data.phone,
          role: data.role,
          groupId: data.groupId,
          locationSharing: data.locationSharing,
          googleUser: acc,
        });

        // isRegister 판단: groupId가 없고 이전에 없던 신규라면 (API는 null 반환)
        const isNewGoogleUser = !data.groupId;
        await processLoginSuccess(data, isNewGoogleUser);
      } catch (e) {
        const errObj = e as any;
        const msg = e instanceof ApiClientError ? e.message : '구글 정보 불러오기에 실패했습니다.';
        if (e instanceof ApiClientError && e.code === "CONFLICT") {
          setGeneralErr("이미 가입된 구글 계정입니다. 로그인 탭을 이용해주세요.");
        } else {
          setGeneralErr(msg);
        }
        toast(msg, 'danger');
      } finally {
        setBusy(false);
      }
    },
    onError: () => {
      setGeneralErr('구글 로그인에 실패했습니다. 다시 시도해주세요.');
      toast('구글 로그인에 실패했습니다.', 'danger');
      setBusy(false);
    },
  });

  // 실제 API 연동 — 성공 시 live 세션으로 전환
  const submit = async () => {
    setPhoneErr("");
    setGeneralErr("");

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setPhoneErr("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }
    if (tab === "register" && !agree) {
      setGeneralErr("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }
    if (busy) return;

    setBusy(true);
    try {
      if (tab === "login") {
        const data = await api.login({ phone: digits });
        reset({
          mode: "live",
          userId: data.userId,
          phone: data.phone,
          role: data.role,
          groupId: data.groupId,
          locationSharing: data.locationSharing,
        });
        await processLoginSuccess(data, false);
      } else {
        const data = await api.register({
          phone: digits,
          role,
          termsAgreed: true,
          privacyAgreed: true,
        });
        reset({ mode: "live", userId: data.userId, phone: data.phone, role: data.role, groupId: null });
        await processLoginSuccess({ ...data, groupId: null }, true);
      }
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : "요청 중 오류가 발생했습니다.";
      if (e instanceof ApiClientError) {
        if (e.code === "NOT_FOUND") {
          setPhoneErr("등록되지 않은 번호입니다. 회원가입을 진행해주세요.");
        } else if (e.code === "CONFLICT") {
          if (msg.includes("Google")) {
             setGeneralErr("이미 연동된 구글 계정입니다. 로그인 탭을 이용해주세요.");
          } else {
             setPhoneErr("이미 가입된 휴대폰 번호입니다. 로그인을 진행해주세요.");
          }
        } else {
          setGeneralErr(msg);
        }
      } else {
        setGeneralErr(msg);
      }
      toast(msg, "danger");
    } finally {
      setBusy(false);
    }
  };

  // 로그인 없이 데모 데이터로 둘러보기
  const enterDemo = () => {
    reset({ mode: "demo", role, phone });
    if (tab === "login") {
      nav("family", "right");
    } else if (role === "parent") {
      set({ onboardingStep: 1 });
      nav("onboarding", "right");
    } else {
      // 가족 자녀 데모: 가족설정 화면으로 랜딩
      toast('회원가입이 완료되었습니다! 가족 설정을 시작하세요.', 'success');
      nav("family-settings", "right");
    }
  };

  return (
    <div
      className="scroll-y"
      style={{ height: "100%", background: "#fff", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          padding: `${TOP_INSET + 24}px 24px 32px`,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {state.pendingInviteCode && (
          <div className="animate-slide-in" style={{ marginBottom: 24 }}>
            <Banner tone="info" icon="users">
              초대받은 가족 그룹에 참여하기 위해<br />
              로그인 또는 회원가입을 진행해주세요.
            </Banner>
          </div>
        )}
        {/* brand lockup */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            marginBottom: 36,
            marginTop: 12,
          }}
        >
          <BrandMark size={72} />
          <div style={{ textAlign: "center" }}>
            <div
              className="t-display"
              style={{ color: "var(--brand-dark)", fontWeight: 800, fontSize: "calc(32px*var(--fz))" }}
            >
              안심맵
            </div>
            <div className="t-h3" style={{ color: "var(--g500)", fontWeight: 500, marginTop: 4 }}>
              부모님 위치 확인 서비스
            </div>
          </div>
        </div>

        {/* tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--g100)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 28,
          }}
        >
          {(
            [
              ["login", "로그인"],
              ["register", "회원가입"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => handleTabChange(k)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 9,
                background: tab === k ? "#fff" : "transparent",
                color: tab === k ? "var(--brand-dark)" : "var(--g500)",
                fontWeight: 700,
                fontSize: "calc(16px*var(--fz))",
                boxShadow: tab === k ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                transition: "all .15s",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, flex: 1 }}>
          {generalErr && (
            <div className="animate-slide-in">
              <Banner tone="danger" icon="alert">{generalErr}</Banner>
            </div>
          )}
          
          <Field
            label="휴대폰 번호"
            value={phone}
            onChange={(v) => {
              setPhone(fmtPhone(v));
              setPhoneErr("");
              setGeneralErr("");
            }}
            placeholder="010-1234-5678"
            type="tel"
            error={phoneErr}
            big
          />

          {tab === "register" && (
            <div
              className="animate-slide-in"
              style={{ display: "flex", flexDirection: "column", gap: 22 }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label className="t-h3" style={{ color: "var(--g800)" }}>
                  역할 선택
                </label>
                <RadioGroup
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: "parent", emoji: "👵", label: "부모님" },
                    { value: "family", emoji: "🧑", label: "가족 자녀" },
                  ]}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label className="t-h3" style={{ color: "var(--g800)" }}>
                  약관 동의
                </label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CheckRow checked={agree} onChange={setAgree} required>
                    개인정보처리방침 동의
                  </CheckRow>
                  <button
                    onClick={() => toast("개인정보처리방침 페이지로 이동합니다.")}
                    className="t-body-sm press"
                    style={{ color: "var(--info)", fontWeight: 700, padding: 8, whiteSpace: "nowrap" }}
                  >
                    보기
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === "login" && (
            <Banner tone="grey" icon="bell">
              실서버에 가입된 번호로 로그인하세요. 없으면 회원가입 탭에서 가입할 수 있어요.
            </Banner>
          )}
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <Btn size="lg" disabled={!valid || busy} onClick={submit}>
            {busy ? "처리 중…" : tab === "login" ? "시작하기" : "동의하고 시작하기"}
          </Btn>
          {DEMO_ENABLED && (
            <button
              className="press"
              onClick={enterDemo}
              disabled={busy}
              style={{
                height: 44,
                color: "var(--g500)",
                fontWeight: 600,
                fontSize: "calc(14px*var(--fz))",
              }}
            >
              로그인 없이 데모로 둘러보기
            </button>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: 'var(--g400)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--g200)' }} />
            <span className="t-body-sm">또는 소셜 로그인</span>
            <div style={{ flex: 1, height: 1, background: 'var(--g200)' }} />
          </div>
          <button
            className="press"
            onClick={() => googleLogin()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              height: 54, borderRadius: 12, border: '1.5px solid var(--g200)',
              background: '#fff', color: 'var(--g800)', fontWeight: 600, fontSize: 'calc(15px*var(--fz))'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════ SCR-002 온보딩 1~4 ════════════════════ */
export function OnboardingScreen() {
  const { state, set, nav, toast } = useApp();
  const step = state.onboardingStep || 1;
  const [code, setCode] = useState("");
  const [reqConsent, setReqConsent] = useState(step >= 3);
  const [optConsent, setOptConsent] = useState(false);
  const [perm, setPerm] = useState(false);

  useEffect(() => {
    localStorage.setItem("ansim_onboarding", String(step));
  }, [step]);
  const go = (s: number) => set({ onboardingStep: s });

  const header = (
    <div
      style={{
        padding: `${TOP_INSET}px 20px 14px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--g100)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {step > 1 && (
          <button
            className="press"
            onClick={() => go(step - 1)}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: -8,
            }}
          >
            <Icon name="back" size={24} color="var(--g700)" stroke={2.2} />
          </button>
        )}
        <span className="t-h3" style={{ color: "var(--g700)", fontWeight: 700 }}>
          안심맵 온보딩
        </span>
      </div>
      <Pill tone="on">{step} / 4</Pill>
    </div>
  );

  const progress = (
    <div style={{ display: "flex", gap: 6, padding: "0 20px", marginBottom: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background: i <= step ? "var(--brand)" : "var(--g200)",
            transition: "background .3s",
          }}
        />
      ))}
    </div>
  );

  let body: React.ReactNode;
  let footer: React.ReactNode;
  if (step === 1) {
    body = (
      <div
        className="animate-slide-in"
        style={{
          padding: "8px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 20,
          marginTop: 24,
        }}
      >
        <div style={{ fontSize: 80 }}>👵💚</div>
        <div className="t-h1" style={{ color: "var(--g900)" }}>
          안녕하세요, 부모님!
        </div>
        <p
          className="t-h3"
          style={{ color: "var(--g600)", fontWeight: 500, lineHeight: 1.6, maxWidth: 280 }}
        >
          가족이 항상 안심할 수 있도록 위치를 공유해요. 설정은 자녀가 옆에서 도와드릴 수 있어요. 4단계면 끝납니다.
        </p>
      </div>
    );
    footer = (
      <Btn size="lg" onClick={() => go(2)}>
        시작하기
      </Btn>
    );
  } else if (step === 2) {
    body = (
      <div
        className="animate-slide-in"
        style={{ padding: "8px 24px", display: "flex", flexDirection: "column", gap: 24 }}
      >
        <div className="t-h2" style={{ color: "var(--g900)" }}>
          자녀 휴대폰에 표시된 가족 초대 코드를 입력해 주세요.
        </div>
        <Field
          label="초대 코드 (6자리)"
          value={code}
          onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          mono
          big
          placeholder="------"
        />
        <Banner tone="grey" icon="users">
          코드는 가족 자녀가 그룹을 만들면 받을 수 있어요.
        </Banner>
      </div>
    );
    footer = (
      <Btn
        size="lg"
        disabled={code.length < 6}
        onClick={() => {
          set({ inviteCode: code });
          go(3);
        }}
      >
        다음 단계로
      </Btn>
    );
  } else if (step === 3) {
    body = (
      <div
        className="animate-slide-in"
        style={{ padding: "8px 24px", display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "14px 16px",
            background: "#FFF4E5",
            border: "2px solid #F0A33A",
            borderRadius: 14,
          }}
        >
          <Icon name="alert" size={26} color="#B25E00" stroke={2.2} />
          <div>
            <div className="t-h3" style={{ color: "#B25E00", fontWeight: 800 }}>
              부모님 직접 조작 필수
            </div>
            <div className="t-body-sm" style={{ color: "#9A5400", marginTop: 3, lineHeight: 1.5 }}>
              자녀의 대리 동의는 법적 처벌 대상이 될 수 있습니다.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <CheckRow checked={reqConsent} onChange={setReqConsent} required>
            개인 위치정보 수집·이용 및 제3자 제공 동의
          </CheckRow>
          <CheckRow checked={optConsent} onChange={setOptConsent}>
            [선택] 혜택 및 알림 수신 동의
          </CheckRow>
        </div>
        <button
          onClick={() => toast("위치기반서비스 이용약관 전문을 표시합니다.")}
          className="t-body-sm press"
          style={{ color: "var(--info)", fontWeight: 700, alignSelf: "flex-start" }}
        >
          약관 전문 내용보기
        </button>
      </div>
    );
    footer = (
      <Btn size="lg" disabled={!reqConsent} onClick={() => setPerm(true)}>
        위치 공유 시작하기
      </Btn>
    );
  } else {
    body = (
      <div
        className="animate-slide-in"
        style={{
          padding: "8px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 20,
          marginTop: 24,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            background: "var(--brand-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="checkCircle" size={56} color="var(--brand)" stroke={2.2} />
        </div>
        <div className="t-h1" style={{ color: "var(--g900)" }}>
          설정이 완료되었어요!
        </div>
        <p
          className="t-h3"
          style={{ color: "var(--g600)", fontWeight: 500, lineHeight: 1.6, maxWidth: 280 }}
        >
          이제 가족들이 부모님의 위치를 확인할 수 있어요. 긴급할 땐 SOS 버튼만 누르세요.
        </p>
        {state.permDenied && (
          <Banner tone="warn" icon="alert">
            위치 권한이 꺼져 있어요. 메인 화면 안내를 확인해 주세요.
          </Banner>
        )}
      </div>
    );
    footer = (
      <Btn
        size="lg"
        onClick={() => {
          set({ onboarded: true });
          localStorage.removeItem("ansim_onboarding");
          nav("parent", "right");
        }}
      >
        안심맵 시작하기
      </Btn>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {header}
      <div className="scroll-y" style={{ flex: 1, paddingTop: 20 }}>
        {progress}
        {body}
      </div>
      <div style={{ padding: "12px 24px 34px", borderTop: "1px solid var(--g100)" }}>{footer}</div>

      {/* fake browser geolocation permission */}
      <BottomSheet open={perm} onClose={() => setPerm(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="mapPin" size={32} color="var(--brand)" stroke={2} />
            <div className="t-h3" style={{ color: "var(--g900)" }}>
              &apos;안심맵&apos;에서 사용자의 위치에 접근하도록 허용하시겠습니까?
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn
              variant="outline"
              onClick={() => {
                setPerm(false);
                set({ permDenied: true });
                go(4);
              }}
            >
              허용 안 함
            </Btn>
            <Btn
              onClick={async () => {
                setPerm(false);
                // live 모드: 위치정보 수집 동의를 서버에 저장 (위치정보법 F-006)
                if (state.mode === "live") {
                  try {
                    await api.saveConsent({
                      locationConsentRequired: true,
                      marketingConsent: optConsent,
                      consentVersion: "v1.0",
                    });
                  } catch (e) {
                    toast(e instanceof ApiClientError ? e.message : "동의 저장에 실패했습니다.", "danger");
                  }
                }
                set({ permDenied: false, locationSharing: true });
                go(4);
              }}
            >
              허용
            </Btn>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ════════════════════ SCR-005 가족 그룹 생성 및 참여 ════════════════════ */
export function GroupScreen() {
  const { state, set, nav, toast } = useApp();
  const live = state.mode === "live";
  const [mode, setMode] = useState<"select" | "create" | "join" | "done">("select");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [liveInvite, setLiveInvite] = useState<string | null>(null);
  // live 모드면 서버가 발급한 실제 코드, 데모면 기존 더미 코드
  const inviteCode = liveInvite || state.groupCode || "KOEL92";

  const copy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inviteCode).catch(() => {});
    }
    toast("초대 코드가 클립보드에 복사되었습니다.", "success");
  };

  // 그룹 생성 (live: 서버 호출 / demo: 기존 동작)
  const createGroup = async () => {
    if (!name.trim() || busy) return;
    if (!live) {
      set({ groupName: name, groupCreated: true });
      setMode("done");
      return;
    }
    setBusy(true);
    try {
      const data = await api.createGroup({ groupName: name.trim() });
      set({ groupName: data.groupName, groupId: data.groupId, groupCreated: true });
      setLiveInvite(data.inviteCode);
      setMode("done");
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "그룹 생성에 실패했습니다.", "danger");
    } finally {
      setBusy(false);
    }
  };

  // 그룹 참여 (live: 서버 호출 / demo: 기존 동작)
  const joinGroup = async () => {
    if (code.length < 6 || busy) return;
    if (!live) {
      if (code === "FULL00") {
        setErr("그룹 인원 한도(5명)를 초과하여 진입할 수 없습니다.");
        return;
      }
      set({ groupCode: code, joined: true });
      nav("family", "right");
      return;
    }
    setBusy(true);
    try {
      const data = await api.joinGroup({ inviteCode: code });
      set({ groupId: data.groupId, groupName: data.groupName, joined: true });
      nav("family", "right");
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : "그룹 참여에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  let content: React.ReactNode;
  if (mode === "select") {
    content = (
      <div
        className="animate-slide-in"
        style={{ display: "flex", flexDirection: "column", gap: 20, padding: "8px 24px" }}
      >
        <div className="t-h2" style={{ color: "var(--g900)" }}>
          서비스를 시작하기 위해 그룹을 선택하거나 새로 만드세요.
        </div>
        <Card
          pad={20}
          onClick={() => setMode("create")}
          style={{ display: "flex", alignItems: "center", gap: 14, border: "1.5px solid var(--g200)" }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--brand-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="plus" size={26} color="var(--brand)" stroke={2.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="t-h3" style={{ color: "var(--g900)" }}>
              새로운 가족 그룹 생성
            </div>
            <div className="t-body-sm" style={{ color: "var(--g500)" }}>
              부모님과 가족을 초대하세요
            </div>
          </div>
          <Icon name="chevronRight" size={22} color="var(--g400)" />
        </Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--g400)" }}>
          <div style={{ flex: 1, height: 1, background: "var(--g200)" }} />
          <span className="t-body-sm">또는</span>
          <div style={{ flex: 1, height: 1, background: "var(--g200)" }} />
        </div>
        <Card
          pad={20}
          onClick={() => setMode("join")}
          style={{ display: "flex", alignItems: "center", gap: 14, border: "1.5px solid var(--g200)" }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--g100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="qr" size={26} color="var(--g700)" stroke={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="t-h3" style={{ color: "var(--g900)" }}>
              초대 코드로 그룹 참여
            </div>
            <div className="t-body-sm" style={{ color: "var(--g500)" }}>
              코드 입력 또는 QR 스캔
            </div>
          </div>
          <Icon name="chevronRight" size={22} color="var(--g400)" />
        </Card>
      </div>
    );
  } else if (mode === "create") {
    content = (
      <div
        className="animate-slide-in"
        style={{ display: "flex", flexDirection: "column", gap: 24, padding: "8px 24px" }}
      >
        <div className="t-h2" style={{ color: "var(--g900)" }}>
          가족 그룹의 이름을 정해 주세요.
        </div>
        <Field label="그룹 이름" value={name} onChange={setName} placeholder="예) 마포구 홍길동가" big />
        <Btn size="lg" disabled={!name.trim() || busy} onClick={createGroup}>
          {busy ? "생성 중…" : "그룹 만들기"}
        </Btn>
      </div>
    );
  } else if (mode === "join") {
    content = (
      <div
        className="animate-slide-in"
        style={{ display: "flex", flexDirection: "column", gap: 24, padding: "8px 24px" }}
      >
        <div className="t-h2" style={{ color: "var(--g900)" }}>
          초대 코드 6자리를 입력하세요.
        </div>
        <Field
          label="초대 코드"
          value={code}
          onChange={(v) => {
            setErr("");
            setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
          }}
          mono
          big
          placeholder="------"
          error={err}
        />
        <button
          className="press"
          onClick={() => toast("카메라 QR 스캐너를 실행합니다.")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            height: 52,
            borderRadius: 12,
            border: "1.5px dashed var(--g300)",
            color: "var(--g600)",
            fontWeight: 700,
            fontSize: "calc(15px*var(--fz))",
          }}
        >
          <Icon name="qr" size={22} color="var(--g600)" stroke={2} /> QR 코드 스캔하기
        </button>
        <Btn size="lg" disabled={code.length < 6 || busy} onClick={joinGroup}>
          {busy ? "참여 중…" : "그룹 참여하기"}
        </Btn>
        {!live && (
          <Banner tone="grey" icon="bell">
            데모: <b className="mono">FULL00</b> 입력 시 정원 초과 오류를 볼 수 있어요.
          </Banner>
        )}
      </div>
    );
  } else {
    content = (
      <div
        className="animate-slide-in"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          padding: "8px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 56 }}>🎉</div>
        <div className="t-h1" style={{ color: "var(--g900)" }}>
          그룹 생성이 완료되었습니다!
        </div>
        <p className="t-h3" style={{ color: "var(--g600)", fontWeight: 500 }}>
          부모님과 다른 가족 자녀를 초대해 보세요.
        </p>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <span
            className="t-body-sm"
            style={{ color: "var(--g500)", fontWeight: 600, textAlign: "left" }}
          >
            초대 코드 (6자리)
          </span>
          <button
            className="press"
            onClick={copy}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              height: 64,
              borderRadius: 14,
              background: "var(--brand-light)",
              border: "2px solid var(--brand)",
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: "calc(30px*var(--fz))",
                fontWeight: 800,
                letterSpacing: ".22em",
                color: "var(--brand-dark)",
              }}
            >
              {inviteCode}
            </span>
            <Icon name="copy" size={22} color="var(--brand)" stroke={2} />
          </button>
        </div>
        <div
          style={{
            padding: 12,
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            marginTop: 4,
          }}
        >
          <QrCode size={132} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", background: "#fff", display: "flex", flexDirection: "column" }}>
      <MobileHeader
        title={mode === "done" ? "초대하기" : "가족 그룹 설정"}
        onBack={
          mode === "select" || mode === "done" ? () => nav("login", "left") : () => setMode("select")
        }
      />
      <div className="scroll-y" style={{ flex: 1, paddingTop: 16 }}>
        {content}
      </div>
      {mode === "done" && (
        <div style={{ padding: "12px 24px 34px" }}>
          <Btn size="lg" icon="mapPin" onClick={() => nav("family", "right")}>
            지도 보러가기
          </Btn>
        </div>
      )}
    </div>
  );
}
