// app.jsx — router, store, frame switching, flow switcher, tweaks
const { useState: useStateApp, useEffect: useEffectApp, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "brand": ["#2E7D32", "#1B5E20", "#4CAF50", "#E8F5E9"],
  "fontScale": 100
}/*EDITMODE-END*/;

// flow groups for the switcher (label → entry route)
const FLOWS = [
  { key: 'auth',   label: '로그인·온보딩', icon: 'user',  entry: 'login',  routes: ['login', 'onboarding', 'group'] },
  { key: 'parent', label: '부모님',        icon: 'sos',   entry: 'parent', routes: ['parent', 'parent-settings'] },
  { key: 'family', label: '가족',          icon: 'mapPin', entry: 'family', routes: ['family', 'family-history', 'family-chat', 'family-geofence'] },
  { key: 'admin',  label: '관리자',        icon: 'chart', entry: 'admin',  routes: ['admin'] },
];
const ROUTE_NAMES = {
  login: 'SCR-001 로그인/회원가입', onboarding: 'SCR-002 온보딩', group: 'SCR-005 가족 그룹',
  parent: 'SCR-003 부모님 메인 (SOS)', 'parent-settings': 'SCR-004 부모님 설정',
  family: 'SCR-006 실시간 지도', 'family-history': 'SCR-007 위치 이력', 'family-chat': 'SCR-008 가족 채팅', 'family-geofence': 'SCR-009 안전 구역',
  admin: 'SCR-010~012 관리자 어드민',
};

function FitStage({ w, h, children }) {
  const [scale, setScale] = useStateApp(1);
  useEffectApp(() => {
    const fit = () => {
      const availH = window.innerHeight - 150;
      const availW = window.innerWidth - 64;
      setScale(Math.min(1, availH / h, availW / w));
    };
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div style={{ width: w * scale, height: h * scale, flexShrink: 0 }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useStateApp('parent');
  const [dir, setDir] = useStateApp('right');
  const [state, setState] = useStateApp({ role: 'parent', locationSharing: true, onboarded: true, onboardingStep: 1 });
  const [toastObj, setToastObj] = useStateApp(null);

  // apply brand palette + font scale to CSS vars
  useEffectApp(() => {
    const r = document.documentElement;
    const b = t.brand || TWEAK_DEFAULTS.brand;
    r.style.setProperty('--brand', b[0]); r.style.setProperty('--brand-dark', b[1]);
    r.style.setProperty('--brand-mint', b[2]); r.style.setProperty('--brand-light', b[3]);
    r.style.setProperty('--fz', (t.fontScale || 100) / 100);
  }, [t.brand, t.fontScale]);

  const nav = useCallback((to, d = 'right') => { setDir(d); setRoute(to); }, []);
  const set = useCallback(patch => setState(s => ({ ...s, ...patch })), []);
  const toast = useCallback((msg, tone = 'default') => {
    setToastObj({ msg, tone });
    clearTimeout(window.__toastT); window.__toastT = setTimeout(() => setToastObj(null), 2600);
  }, []);

  const ctx = { route, nav, state, set, toast };
  const isAdmin = route === 'admin';
  const activeFlow = FLOWS.find(f => f.routes.includes(route))?.key;

  const screen = (() => {
    switch (route) {
      case 'login': return <LoginScreen />;
      case 'onboarding': return <OnboardingScreen />;
      case 'group': return <GroupScreen />;
      case 'parent': return <ParentMain />;
      case 'parent-settings': return <ParentSettings />;
      case 'family': return <FamilyMap />;
      case 'family-history': return <FamilyHistory />;
      case 'family-chat': return <FamilyChat />;
      case 'family-geofence': return <FamilyGeofence />;
      case 'admin': return <AdminApp />;
      default: return <ParentMain />;
    }
  })();

  return (
    <AppCtx.Provider value={ctx}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#E9EAE6,#DCDED8)' }}>
        {/* top flow switcher */}
        <div style={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,.06)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <BrandMark size={30} />
            <span style={{ fontWeight: 800, color: 'var(--brand-dark)', fontSize: 17 }}>안심맵</span>
            <span style={{ fontSize: 12, color: 'var(--g500)', fontWeight: 600, padding: '3px 8px', background: 'var(--g100)', borderRadius: 6, marginLeft: 2 }}>프로토타입</span>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,.04)', borderRadius: 10, padding: 4 }}>
            {FLOWS.map(f => (
              <button key={f.key} onClick={() => nav(f.entry, 'right')} className="press"
                style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 8,
                  background: activeFlow === f.key ? '#fff' : 'transparent', color: activeFlow === f.key ? 'var(--brand-dark)' : 'var(--g600)',
                  fontWeight: 700, fontSize: 14, boxShadow: activeFlow === f.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none', transition: 'all .15s' }}>
                <Icon name={f.icon} size={17} color={activeFlow === f.key ? 'var(--brand)' : 'var(--g500)'} stroke={2} /> {f.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: 'var(--g500)', fontWeight: 600 }}>{ROUTE_NAMES[route]}</span>
        </div>

        {/* stage */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px 48px' }}>
          {isAdmin ? (
            <FitStage w={1180} h={760}>
              <ChromeWindow width={1180} height={760} url="admin.ansimmap.kr/groups" tabs={[{ title: '안심맵 관리자 어드민' }]}>
                <div style={{ position: 'relative', height: '100%' }}>
                  {screen}
                  <Toast toast={toastObj} />
                </div>
              </ChromeWindow>
            </FitStage>
          ) : (
            <FitStage w={402} h={874}>
              <IOSDevice>
                <div key={route} className={dir === 'right' ? 'slide-in' : ''} style={{ height: '100%', position: 'relative' }}>
                  {screen}
                </div>
                <Toast toast={toastObj} />
              </IOSDevice>
            </FitStage>
          )}
        </div>
      </div>

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="브랜드 컬러" />
        <TweakColor label="그린 팔레트" value={t.brand}
          options={[
            ["#2E7D32", "#1B5E20", "#4CAF50", "#E8F5E9"],
            ["#0F8A6B", "#0A5E49", "#2BB892", "#E2F6F0"],
            ["#4F7A3A", "#365426", "#74A357", "#EEF4E6"],
            ["#178A8A", "#0E5E5E", "#2BB1B1", "#E2F4F4"],
          ]}
          onChange={v => setTweak('brand', v)} />
        <TweakSection label="시니어 가독성" />
        <TweakSlider label="폰트 크기" value={t.fontScale} min={90} max={140} step={5} unit="%"
          onChange={v => setTweak('fontScale', v)} />
      </TweaksPanel>
    </AppCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
