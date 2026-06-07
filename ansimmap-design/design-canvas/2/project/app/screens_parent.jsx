// screens_parent.jsx — SCR-003 부모님 메인(SOS), SCR-004 부모님 설정
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

/* ════════════════════ SCR-003 부모님 메인 (SOS) ════════════════════ */
function ParentMain() {
  const { state, set, nav, toast } = useApp();
  const [sos, setSos] = useStateP('idle'); // idle | counting | sent
  const [count, setCount] = useStateP(2);
  const sharing = state.locationSharing !== false && !state.consentRevoked;
  const timer = useRefP(null);

  const startSos = () => { setCount(2); setSos('counting'); };
  const cancel = () => { clearTimeout(timer.current); setSos('idle'); };

  useEffectP(() => {
    if (sos !== 'counting') return;
    if (count <= 0) { setSos('sent'); return; }
    timer.current = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer.current);
  }, [sos, count]);

  useEffectP(() => {
    if (sos === 'sent') { const t = setTimeout(() => setSos('idle'), 3400); return () => clearTimeout(t); }
  }, [sos]);

  return (
    <div style={{ height: '100%', background: 'var(--g50)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <MobileHeader brand right={<IconBtn name="settings" onClick={() => nav('parent-settings', 'right')} />} />

      <div className="scroll-y" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px 0' }}>
        {/* iOS foreground keep banner */}
        <div style={{ marginBottom: 12 }}>
          <Banner tone="warn" icon="alert">화면을 켜두면 위치가 더 정확해요. 홈 화면에 추가하면 더 편리합니다.</Banner>
        </div>
        {state.permDenied && <div style={{ marginBottom: 12 }}><Banner tone="danger" icon="mapPin" action={<button className="t-caption press" onClick={() => toast('위치 권한 활성화 방법을 안내합니다.')} style={{ color: 'var(--danger)', fontWeight: 800, whiteSpace: 'nowrap' }}>방법 보기</button>}>위치 권한 꺼짐</Banner></div>}

        {/* status card */}
        <Card pad={18} style={{ display: 'flex', alignItems: 'center', gap: 14, border: sharing ? '1.5px solid var(--brand-light)' : '1.5px solid var(--g200)' }}>
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            {sharing && <span className="ping-ring" style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--brand)' }} />}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: sharing ? 'var(--brand)' : 'var(--g400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="mapPin" size={24} color="#fff" stroke={2.2} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="t-h2" style={{ color: 'var(--g900)' }}>{sharing ? '위치 전송 중' : '위치 공유 꺼짐'}</div>
            <div className="t-body-sm" style={{ color: 'var(--g500)', marginTop: 2 }}>{sharing ? '가족이 내 위치를 보고 있어요' : '가족이 내 위치를 볼 수 없어요'}</div>
          </div>
        </Card>

        {/* SOS button — fills the majority of the screen */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 280 }}>
          <button className="press animate-sos-pulse" onClick={startSos}
            style={{ width: 230, height: 230, borderRadius: 999, background: 'radial-gradient(circle at 38% 32%, #FF5A52, var(--danger))',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff' }}>
            <Icon name="sos" size={64} color="#fff" stroke={2.4} />
            <span style={{ fontSize: 'calc(34px*var(--fz))', fontWeight: 800, letterSpacing: '.04em' }}>SOS</span>
            <span style={{ fontSize: 'calc(17px*var(--fz))', fontWeight: 700, opacity: .95 }}>긴급 호출</span>
          </button>
          <p className="t-h3" style={{ color: 'var(--g500)', fontWeight: 500, textAlign: 'center', maxWidth: 240 }}>위급할 때 버튼을 누르면 가족 모두에게 알림이 갑니다.</p>
        </div>
      </div>

      {/* location toggle */}
      <div style={{ padding: '14px 20px calc(22px + 12px)', borderTop: '1px solid var(--g200)', background: '#fff', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div className="t-h3" style={{ color: 'var(--g900)' }}>실시간 위치 공유</div>
          <div className="t-body-sm" style={{ color: 'var(--g500)' }}>{sharing ? '켜짐 · 30초마다 전송' : '꺼짐'}</div>
        </div>
        <Toggle size="lg" on={sharing} onChange={v => {
          if (state.consentRevoked) { toast('동의를 철회한 상태예요. 설정에서 다시 동의해 주세요.', 'danger'); return; }
          set({ locationSharing: v }); toast(v ? '위치 공유를 켰어요. 가족에게 알렸습니다.' : '위치 공유를 껐어요. 가족에게 알렸습니다.', v ? 'success' : 'default');
        }} />
      </div>

      {/* SOS countdown overlay */}
      {sos === 'counting' && (
        <div className="dim-in" style={{ position: 'absolute', inset: 0, zIndex: 500, background: 'radial-gradient(circle at 50% 40%, #E53935, #B71C1C)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32 }}>
          <div style={{ fontSize: 'calc(28px*var(--fz))', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>🚨 긴급 상황</div>
          <div className="animate-throb" style={{ width: 180, height: 180, borderRadius: 999, background: 'rgba(255,255,255,.16)', border: '4px solid rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 'calc(110px*var(--fz))', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{count}</span>
          </div>
          <p style={{ fontSize: 'calc(19px*var(--fz))', fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>가족들에게 SOS 알림과<br />현재 위치를 전송합니다.</p>
          <button className="press" onClick={cancel} style={{ marginTop: 8, height: 60, padding: '0 48px', borderRadius: 999, background: '#fff', color: 'var(--danger)', fontSize: 'calc(20px*var(--fz))', fontWeight: 800 }}>발송 취소</button>
        </div>
      )}

      {/* SOS sent */}
      {sos === 'sent' && (
        <div className="dim-in" style={{ position: 'absolute', inset: 0, zIndex: 500, background: 'rgba(20,18,18,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 32 }}>
          <div style={{ width: 110, height: 110, borderRadius: 999, background: 'rgba(76,175,80,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="checkCircle" size={68} color="#69DB7C" stroke={2.2} />
          </div>
          <div style={{ fontSize: 'calc(24px*var(--fz))', fontWeight: 800, color: '#fff', textAlign: 'center' }}>가족에게 긴급 알림을<br />보냈습니다.</div>
          <p style={{ fontSize: 'calc(16px*var(--fz))', color: 'rgba(255,255,255,.7)', textAlign: 'center' }}>📳 사이렌 진동이 울리고 있어요</p>
          <button className="press" onClick={() => setSos('idle')} style={{ height: 56, padding: '0 40px', borderRadius: 12, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 'calc(17px*var(--fz))', fontWeight: 700 }}>확인</button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ SCR-004 부모님 설정 ════════════════════ */
function ParentSettings() {
  const { state, set, nav, toast } = useApp();
  const [confirm, setConfirm] = useStateP(false);
  const battery = !!state.batterySaver;

  const Row = ({ icon, label, onClick }) => (
    <button className="press" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 16px', background: '#fff', borderBottom: '1px solid var(--g100)' }}>
      <Icon name={icon} size={22} color="var(--g600)" stroke={2} />
      <span className="t-body-md" style={{ color: 'var(--g800)', flex: 1, textAlign: 'left' }}>{label}</span>
      <Icon name="chevronRight" size={20} color="var(--g400)" />
    </button>
  );

  return (
    <div style={{ height: '100%', background: 'var(--g50)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MobileHeader title="설정" onBack={() => nav('parent', 'left')} />
      <div className="scroll-y" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* battery saver */}
        <div>
          <div className="t-overline" style={{ color: 'var(--g500)', padding: '0 4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="battery" size={16} color="var(--g500)" stroke={2} /> 배터리 절약 모드</div>
          <Card pad={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
              <div style={{ flex: 1 }}>
                <div className="t-body-md" style={{ color: 'var(--g900)' }}>배터리 절약 모드 켜기</div>
                <div className="t-body-sm" style={{ color: 'var(--g500)', marginTop: 2 }}>위치 전송 주기가 3분으로 늘어납니다.</div>
              </div>
              <Toggle on={battery} onChange={v => { set({ batterySaver: v }); toast(v ? '배터리 절약 모드를 켰어요 (3분 주기)' : '배터리 절약 모드를 껐어요 (30초 주기)'); }} />
            </div>
          </Card>
        </div>

        {/* legal */}
        <div>
          <div className="t-overline" style={{ color: 'var(--g500)', padding: '0 4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="doc" size={16} color="var(--g500)" stroke={2} /> 법률 및 개인정보 보호</div>
          <Card pad={0} style={{ overflow: 'hidden' }}>
            <Row icon="doc" label="개인정보처리방침 열람" onClick={() => toast('개인정보처리방침 페이지를 표시합니다.')} />
            <div style={{ marginBottom: -1 }}><Row icon="mapPin" label="위치기반서비스 이용약관" onClick={() => toast('위치기반서비스 이용약관을 표시합니다.')} /></div>
          </Card>
        </div>

        {/* danger zone */}
        <div>
          <div className="t-overline" style={{ color: 'var(--danger)', padding: '0 4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="alert" size={16} color="var(--danger)" stroke={2} /> 위험 구역</div>
          <Card pad={18} style={{ border: '1.5px solid var(--danger-light)' }}>
            <p className="t-body" style={{ color: 'var(--g700)', marginBottom: 14, lineHeight: 1.5 }}>위치 정보 수집 동의를 철회하면 가족들이 더 이상 위치를 볼 수 없습니다.</p>
            <Btn variant="dangerGhost" icon="trash" onClick={() => setConfirm(true)}>위치 공유 동의 철회</Btn>
          </Card>
        </div>
      </div>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="alert" size={30} color="var(--danger)" stroke={2.2} />
          </div>
          <div className="t-h2" style={{ color: 'var(--g900)' }}>정말 동의를 철회하시겠어요?</div>
          <p className="t-body" style={{ color: 'var(--g600)', lineHeight: 1.5 }}>동의를 철회하면 가족들이 나의 위치를 전혀 볼 수 없습니다. 자녀들에게도 철회 사실이 알림으로 전송됩니다.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Btn variant="outline" onClick={() => setConfirm(false)}>취소</Btn>
            <Btn variant="danger" onClick={() => { setConfirm(false); set({ consentRevoked: true, locationSharing: false, onboardingStep: 3 }); toast('위치 정보 제공 동의를 철회했습니다.', 'danger'); setTimeout(() => nav('onboarding', 'left'), 600); }}>철회하기</Btn>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

Object.assign(window, { ParentMain, ParentSettings });
