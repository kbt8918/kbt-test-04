// screens_family.jsx — SCR-006 지도, SCR-007 이력, SCR-008 채팅, SCR-009 안전구역
const { useState: useStateF, useEffect: useEffectF, useRef: useRefF } = React;

/* ════════════════════ SCR-006 가족 메인 (실시간 지도) ════════════════════ */
function FamilyMap() {
  const { state, nav, toast } = useApp();
  const [sosOpen, setSosOpen] = useStateF(false);
  const [calling, setCalling] = useStateF(false);
  const sharing = state.locationSharing !== false && !state.consentRevoked;

  const markers = [{ x: 46, y: 38, emoji: '👵', label: '홍길순 (어머니)', color: 'var(--brand)', active: true, stale: !sharing }];

  return (
    <div style={{ height: '100%', background: 'var(--g100)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <MobileHeader brand right={<IconBtn name="settings" onClick={() => toast('가족 설정 메뉴입니다.')} />} />

      <div style={{ flex: 1, position: 'relative' }}>
        <FakeMap markers={markers} dim={!sharing} grey={!sharing} />

        {/* off banner */}
        {!sharing && (
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 50 }}>
            <Banner tone="grey" icon="mapPin">부모님이 위치 공유를 꺼두셨습니다.</Banner>
          </div>
        )}

        {/* layer/geofence + SOS-test controls */}
        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 45, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="press" onClick={() => nav('family-geofence', 'right')} title="안전 구역" style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="shield" size={22} color="var(--brand)" stroke={2} /></button>
        </div>

        {/* demo SOS trigger */}
        <button className="press" onClick={() => setSosOpen(true)} style={{ position: 'absolute', left: 14, bottom: 130, zIndex: 45, display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 999, background: 'var(--danger)', color: '#fff', fontWeight: 800, fontSize: 'calc(13px*var(--fz))', boxShadow: '0 4px 12px rgba(211,47,47,.4)' }}>
          <Icon name="sos" size={18} color="#fff" stroke={2.4} /> SOS 수신 미리보기
        </button>

        {/* location summary card */}
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, zIndex: 45 }}>
          <Card pad={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: sharing ? 10 : 0 }}>
              <Avatar emoji="👵" size={44} ring={sharing ? 'var(--brand)' : 'var(--g400)'} />
              <div style={{ flex: 1 }}>
                <div className="t-h3" style={{ color: 'var(--g900)' }}>홍길순 <span style={{ color: 'var(--g500)', fontWeight: 500 }}>(어머니)</span></div>
                {sharing
                  ? <div className="t-body-sm" style={{ color: 'var(--g600)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}><Icon name="mapPin" size={15} color="var(--brand)" stroke={2} /> 서울시 마포구 창전동 12-4</div>
                  : <div className="t-body-sm" style={{ color: 'var(--g500)', marginTop: 2 }}>위치 공유가 꺼져 있어요</div>}
              </div>
              <Pill tone={sharing ? 'on' : 'off'} dot>{sharing ? '실시간' : '꺼짐'}</Pill>
            </div>
            {sharing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'var(--g50)', borderRadius: 10 }}>
                  <Icon name="battery" size={16} color="var(--brand)" stroke={2} /><span className="t-body-sm" style={{ color: 'var(--g700)', fontWeight: 600 }}>배터리 78%</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'var(--g50)', borderRadius: 10 }}>
                  <Icon name="clock" size={16} color="var(--g500)" stroke={2} /><span className="t-body-sm" style={{ color: 'var(--g700)', fontWeight: 600 }}>30초 전 갱신</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <BottomNav active="family" onNav={k => nav(k, 'right')} />

      {/* SOS receive modal */}
      {sosOpen && (
        <div className="dim-in" style={{ position: 'absolute', inset: 0, zIndex: 600, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <div className="sheet-up" style={{ width: '100%', background: '#fff', borderRadius: 22, border: '2px solid var(--danger)', overflow: 'hidden' }}>
            <div className="flash-red" style={{ background: 'var(--danger)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, opacity: 1 }}>
              <Icon name="sos" size={28} color="#fff" stroke={2.4} />
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 'calc(20px*var(--fz))' }}>SOS 긴급 상황 발생!!</span>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar emoji="👵" size={52} ring="var(--danger)" />
                <div className="t-h2" style={{ color: 'var(--g900)' }}>홍길순 어르신이<br />도움을 요청하셨습니다!</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: 'var(--danger-light)', borderRadius: 12 }}>
                <Icon name="mapPin" size={20} color="var(--danger)" stroke={2} />
                <span className="t-body" style={{ color: 'var(--g800)', fontWeight: 600 }}>서울시 마포구 창전동 12-4 창전현대아파트 앞</span>
              </div>
              <Btn variant="danger" size="lg" icon="phone" onClick={() => setCalling(true)}>전화로 직접 연결하기</Btn>
              <button className="press" onClick={() => setSosOpen(false)} style={{ color: 'var(--g500)', fontWeight: 700, fontSize: 'calc(15px*var(--fz))', padding: 8 }}>지도에서 위치 확인</button>
            </div>
          </div>
        </div>
      )}

      {/* fake call screen */}
      {calling && (
        <div className="dim-in" style={{ position: 'absolute', inset: 0, zIndex: 700, background: 'linear-gradient(160deg,#1B5E20,#0E3D12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '80px 32px 60px', color: '#fff' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Avatar emoji="👵" size={110} />
            <div style={{ fontSize: 'calc(26px*var(--fz))', fontWeight: 800 }}>홍길순 (어머니)</div>
            <div style={{ fontSize: 'calc(16px*var(--fz))', opacity: .8 }}>연결 중…</div>
          </div>
          <button className="press" onClick={() => { setCalling(false); setSosOpen(false); }} style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}>
            <Icon name="phone" size={32} color="#fff" stroke={2.4} style={{ transform: 'rotate(135deg)' }} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ SCR-007 위치 이력 조회 ════════════════════ */
const HISTORY_DATA = {
  '2026-05-31': {
    path: [{ x: 16, y: 30 }, { x: 30, y: 34 }, { x: 38, y: 50 }, { x: 52, y: 56 }, { x: 64, y: 62 }, { x: 72, y: 74 }],
    stops: [
      { t: '10:20', label: '마포구 신촌로 12', tag: '출발', tone: 'start' },
      { t: '11:15', label: '창전동 현대아파트 앞', tag: '', tone: 'mid' },
      { t: '12:00', label: '마포노인복지관', tag: '도착', tone: 'end' },
    ],
  },
  '2026-05-30': {
    path: [{ x: 70, y: 24 }, { x: 56, y: 36 }, { x: 44, y: 44 }, { x: 30, y: 60 }],
    stops: [
      { t: '08:40', label: '자택 (창전동 12-4)', tag: '출발', tone: 'start' },
      { t: '09:30', label: '마포구청 사거리', tag: '', tone: 'mid' },
      { t: '10:10', label: '서교동 행복마트', tag: '도착', tone: 'end' },
    ],
  },
  '2026-05-29': { path: [], stops: [] },
};

function FamilyHistory() {
  const { nav, toast } = useApp();
  const dates = Object.keys(HISTORY_DATA);
  const [date, setDate] = useStateF(dates[0]);
  const [pickerOpen, setPickerOpen] = useStateF(false);
  const data = HISTORY_DATA[date];
  const hasData = data.stops.length > 0;
  const toneColor = { start: 'var(--brand)', mid: 'var(--g500)', end: 'var(--danger)' };

  return (
    <div style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MobileHeader title="이동 기록 조회" onBack={() => nav('family', 'left')} />
      {/* date picker */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--g100)', position: 'relative', zIndex: 30 }}>
        <button className="press" onClick={() => setPickerOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 48, padding: '0 16px', borderRadius: 12, border: '1.5px solid var(--g200)', background: '#fff' }}>
          <Icon name="calendar" size={20} color="var(--brand)" stroke={2} />
          <span className="t-body-md" style={{ flex: 1, textAlign: 'left', color: 'var(--g900)' }}>{date.replace(/-/g, '. ')}</span>
          <Icon name="chevronDown" size={20} color="var(--g500)" />
        </button>
        {pickerOpen && (
          <div className="dim-in" style={{ position: 'absolute', left: 16, right: 16, top: 64, background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.15)', border: '1px solid var(--g200)', overflow: 'hidden', zIndex: 40 }}>
            {dates.map(d => (
              <button key={d} className="press" onClick={() => { setDate(d); setPickerOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '14px 16px', background: d === date ? 'var(--brand-light)' : '#fff', borderBottom: '1px solid var(--g100)' }}>
                <span className="t-body-md" style={{ flex: 1, textAlign: 'left', color: d === date ? 'var(--brand-dark)' : 'var(--g800)' }}>{d.replace(/-/g, '. ')}</span>
                {HISTORY_DATA[d].stops.length === 0 && <span className="t-caption" style={{ color: 'var(--g400)' }}>기록 없음</span>}
                {d === date && <Icon name="check" size={18} color="var(--brand)" stroke={2.5} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* map */}
      <div style={{ height: 240, position: 'relative', flexShrink: 0, background: 'var(--g100)' }}>
        {hasData ? (
          <FakeMap path={data.path} showControls={false}>
            <MapDot x={data.path[0].x} y={data.path[0].y} color="var(--brand)" label="출발" />
            <MapDot x={data.path[data.path.length - 1].x} y={data.path[data.path.length - 1].y} color="var(--danger)" label="도착" />
          </FakeMap>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--g50)' }}>
            <Icon name="route" size={40} color="var(--g300)" stroke={1.6} />
          </div>
        )}
      </div>

      {/* timeline */}
      <div className="scroll-y" style={{ flex: 1, padding: '18px 20px' }}>
        <div className="t-overline" style={{ color: 'var(--g500)', marginBottom: 14 }}>시간대별 이동 이력 · 최대 7일</div>
        {hasData ? (
          <div style={{ position: 'relative', paddingLeft: 8 }}>
            {data.stops.map((s, i) => (
              <button key={i} className="press" onClick={() => toast(`${s.t} ${s.label} 위치로 이동합니다.`)} style={{ display: 'flex', gap: 14, width: '100%', textAlign: 'left', paddingBottom: i < data.stops.length - 1 ? 22 : 0, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 999, background: toneColor[s.tone], border: '3px solid #fff', boxShadow: `0 0 0 2px ${toneColor[s.tone]}`, zIndex: 2 }} />
                  {i < data.stops.length - 1 && <span style={{ width: 2, flex: 1, background: 'var(--g200)', marginTop: 2 }} />}
                </div>
                <div style={{ flex: 1, paddingTop: -2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono t-body-sm" style={{ color: 'var(--g500)', fontWeight: 700 }}>{s.t}</span>
                    {s.tag && <Pill tone={s.tone === 'end' ? 'danger' : 'on'}>{s.tag}</Pill>}
                  </div>
                  <div className="t-body-md" style={{ color: 'var(--g900)', marginTop: 3 }}>{s.label}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px', textAlign: 'center' }}>
            <Icon name="calendar" size={48} color="var(--g300)" stroke={1.6} />
            <div className="t-h3" style={{ color: 'var(--g600)' }}>이동 이력이 없습니다</div>
            <p className="t-body-sm" style={{ color: 'var(--g500)', lineHeight: 1.5 }}>선택하신 날짜의 위치 이동 이력이 없습니다. 부모님 단말기 전원이나 네트워크 상태를 확인해 주세요.</p>
          </div>
        )}
      </div>

      <BottomNav active="family-history" onNav={k => nav(k, k === 'family-history' ? 'right' : 'left')} />
    </div>
  );
}

/* ════════════════════ SCR-008 가족 채팅방 ════════════════════ */
function FamilyChat() {
  const { nav } = useApp();
  const [msgs, setMsgs] = useStateF([
    { id: 1, who: 'mom', name: '어머니', text: '얘들아 나 복지관 도착했다. 걱정 마라.', time: '12:02' },
    { id: 2, who: 'me', text: '네 확인했어요! 무리하지 마세요 🙏', time: '12:04', read: true },
    { id: 3, who: 'sis', name: '여동생', text: '엄마 이따 저녁에 전화드릴게요~', time: '12:06' },
  ]);
  const [text, setText] = useStateF('');
  const scrollRef = useRefF(null);
  useEffectF(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setMsgs(m => [...m, { id: Date.now(), who: 'me', text: t, time: new Date().toTimeString().slice(0, 5), read: false }]);
    setText('');
  };

  const Bubble = ({ m }) => {
    const mine = m.who === 'me';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
        {!mine && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, paddingLeft: 4 }}><Avatar emoji={m.who === 'mom' ? '👵' : '🧑‍🦰'} size={24} /><span className="t-body-sm" style={{ color: 'var(--g600)', fontWeight: 600 }}>{m.name}</span></div>}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: mine ? 'row-reverse' : 'row', maxWidth: '82%' }}>
          <div style={{ padding: '10px 14px', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: mine ? 'var(--brand)' : '#fff', color: mine ? '#fff' : 'var(--g900)',
            border: mine ? 'none' : '1px solid var(--g200)', fontSize: 'calc(16px*var(--fz))', lineHeight: 1.45, wordBreak: 'break-word' }}>{m.text}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
            {mine && m.read && <span className="t-caption" style={{ color: 'var(--brand)' }}>읽음</span>}
            <span className="t-body-sm" style={{ color: 'var(--g400)', fontSize: 'calc(11px*var(--fz))' }}>{m.time}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', background: 'var(--g50)', display: 'flex', flexDirection: 'column' }}>
      <MobileHeader title="가족 그룹 채팅방" sub="홍길순가 · 4명" onBack={() => nav('family', 'left')} />
      <div ref={scrollRef} className="scroll-y" style={{ flex: 1, padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <span className="t-body-sm" style={{ background: 'rgba(0,0,0,.06)', color: 'var(--g600)', padding: '4px 12px', borderRadius: 999, fontWeight: 600 }}>2026년 5월 31일 일요일</span>
        </div>
        {msgs.map(m => <Bubble key={m.id} m={m} />)}
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--g200)', background: '#fff', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <input value={text} onChange={e => setText(e.target.value.slice(0, 500))} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="안부 메시지를 입력하세요" style={{ flex: 1, height: 48, padding: '0 16px', borderRadius: 999, border: '1.5px solid var(--g200)', outline: 'none', fontSize: 'calc(16px*var(--fz))', background: 'var(--g50)' }} />
        <button className="press" onClick={send} style={{ width: 48, height: 48, borderRadius: 999, background: text.trim() ? 'var(--brand)' : 'var(--g300)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
          <Icon name="send" size={22} color="#fff" stroke={2.2} />
        </button>
      </div>
      <BottomNav active="family-chat" onNav={k => nav(k, 'left')} />
    </div>
  );
}

/* ════════════════════ SCR-009 안전 구역 설정 (지오펜싱) ════════════════════ */
function FamilyGeofence() {
  const { nav, toast } = useApp();
  const [center, setCenter] = useStateF({ x: 50, y: 42 });
  const [radius, setRadius] = useStateF(500); // meters
  const [name, setName] = useStateF('마포 노인복지관');
  const [upsell, setUpsell] = useStateF(false);
  // map radius meters -> svg units (100 = ~ map width). 5km ~ 40 units, 100m ~ 4 units
  const rUnits = 3 + (radius / 5000) * 34;
  const fmtR = radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`;

  const onMapClick = e => {
    const r = e.currentTarget.getBoundingClientRect();
    setCenter({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MobileHeader title="안전 구역 설정" onBack={() => nav('family', 'left')} />
      <div style={{ height: 280, position: 'relative', flexShrink: 0, cursor: 'crosshair' }} onClick={onMapClick}>
        <FakeMap circle={{ x: center.x, y: center.y, r: rUnits }} markers={[{ x: center.x, y: center.y, emoji: '🏡', color: 'var(--brand)' }]} showControls={false} />
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 50 }}><Banner tone="info" icon="mapPin">지도를 눌러 중심 위치를 옮기세요</Banner></div>
      </div>
      <div className="scroll-y" style={{ flex: 1, padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <Field label="구역 이름" value={name} onChange={setName} placeholder="예) 마포 노인복지관" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label className="t-h3" style={{ color: 'var(--g800)' }}>반경 설정</label>
            <span className="mono" style={{ fontWeight: 800, color: 'var(--brand-dark)', fontSize: 'calc(18px*var(--fz))' }}>{fmtR}</span>
          </div>
          <input type="range" min={100} max={5000} step={50} value={radius} onChange={e => setRadius(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--brand)', height: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="t-body-sm" style={{ color: 'var(--g400)' }}>100m</span><span className="t-body-sm" style={{ color: 'var(--g400)' }}>5km</span></div>
        </div>
      </div>
      <div style={{ padding: '12px 20px calc(22px + 12px)', borderTop: '1px solid var(--g100)' }}>
        <Btn size="lg" disabled={!name.trim()} icon="shieldCheck" onClick={() => setUpsell(true)}>안전 구역 저장</Btn>
      </div>

      <BottomSheet open={upsell} onClose={() => setUpsell(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="shield" size={30} color="var(--brand)" stroke={2} /></div>
          <div className="t-h2" style={{ color: 'var(--g900)' }}>Free 플랜은 안전 구역 1개까지</div>
          <p className="t-body" style={{ color: 'var(--g600)', lineHeight: 1.5 }}>현재 Free 플랜에서는 안전 구역을 최대 1개까지만 등록할 수 있습니다. Pro 플랜으로 업그레이드하시겠습니까?</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Btn variant="outline" onClick={() => { setUpsell(false); toast('안전 구역이 저장되었습니다.', 'success'); setTimeout(() => nav('family', 'left'), 500); }}>이대로 저장</Btn>
            <Btn onClick={() => { setUpsell(false); toast('Pro 플랜 안내 페이지로 이동합니다.'); }}>Pro 업그레이드</Btn>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

Object.assign(window, { FamilyMap, FamilyHistory, FamilyChat, FamilyGeofence });
