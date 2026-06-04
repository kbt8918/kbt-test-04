// map.jsx — stylized faux Kakao map (no API key needed)
// <FakeMap markers={[{x,y,emoji,label,color,stale,active}]} path={[{x,y}]} circle={{x,y,r,tone}} dim grey />
// coordinates are 0..100 percentages over the visible map area.

function FakeMap({ markers = [], path = null, circle = null, dim = false, grey = false, showControls = true, children, style = {} }) {
  // a believable neighborhood drawn in a 0..100 x 0..100 space
  const land = grey ? '#EDEDED' : '#F4F2EC';
  const park = grey ? '#DDDDDD' : '#CBE3C4';
  const water = grey ? '#D6D6D6' : '#A9D2EE';
  const roadMajor = grey ? '#FFFFFF' : '#FBEFC9';
  const roadMinor = '#FFFFFF';
  const casing = grey ? '#DADADA' : '#E7E2D4';
  const block = grey ? '#F4F4F4' : '#FAF8F2';

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: land, ...style }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ display: 'block' }}>
        {/* parks */}
        <path d="M-2 8 Q 14 2 26 10 Q 30 22 18 28 Q 4 30 -2 22 Z" fill={park} opacity="0.9" />
        <rect x="62" y="58" width="34" height="26" rx="3" fill={park} opacity="0.85" />
        <circle cx="82" cy="20" r="11" fill={park} opacity="0.8" />
        {/* river */}
        <path d="M-5 70 Q 25 60 45 74 Q 65 88 105 78 L 105 100 L -5 100 Z" fill={water} opacity="0.92" />
        <path d="M-5 70 Q 25 60 45 74 Q 65 88 105 78" fill="none" stroke={grey ? '#C7C7C7' : '#8FC0E6'} strokeWidth="0.6" />
        {/* block fills */}
        <rect x="30" y="14" width="22" height="20" rx="2" fill={block} />
        <rect x="56" y="12" width="18" height="16" rx="2" fill={block} />
        <rect x="8" y="40" width="20" height="20" rx="2" fill={block} />
        <rect x="34" y="40" width="26" height="18" rx="2" fill={block} />
        <rect x="64" y="36" width="22" height="16" rx="2" fill={block} />
        {/* road casings (wider, drawn first) */}
        <g stroke={casing} fill="none" strokeLinecap="round">
          <path d="M-5 36 H 105" strokeWidth="7.5" />
          <path d="M30 -5 V 105" strokeWidth="7.5" />
          <path d="M-5 8 Q 40 30 105 20" strokeWidth="6" />
        </g>
        {/* major roads */}
        <g fill="none" strokeLinecap="round">
          <path d="M-5 36 H 105" stroke={roadMajor} strokeWidth="6" />
          <path d="M30 -5 V 105" stroke={roadMajor} strokeWidth="6" />
          <path d="M-5 8 Q 40 30 105 20" stroke={roadMinor} strokeWidth="4.5" />
        </g>
        {/* minor roads */}
        <g stroke={roadMinor} fill="none" strokeWidth="2.6" strokeLinecap="round">
          <path d="M10 -5 V 36" />
          <path d="M58 0 V 105" />
          <path d="M82 -5 V 105" />
          <path d="M-5 58 H 60" />
          <path d="M30 78 H 105" />
          <path d="M0 20 H 30" />
        </g>
        <g stroke={roadMinor} fill="none" strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
          <path d="M44 -5 V 36" />
          <path d="M70 36 V 78" />
          <path d="M30 50 H 82" />
        </g>

        {/* geofence circle */}
        {circle && (
          <g className={circle.tone === 'danger' ? 'flash-red' : ''}>
            <circle cx={circle.x} cy={circle.y} r={circle.r}
              fill={circle.tone === 'danger' ? 'rgba(211,47,47,0.15)' : 'rgba(46,125,50,0.15)'}
              stroke={circle.tone === 'danger' ? '#D32F2F' : '#2E7D32'} strokeWidth="0.7" strokeDasharray="2 1.5" />
          </g>
        )}

        {/* path polyline */}
        {path && path.length > 1 && (
          <g>
            <polyline points={path.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="#1976D2" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
            <polyline points={path.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="#fff" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="0.5 2.5" />
          </g>
        )}
      </svg>

      {/* dim overlay (location off) */}
      {dim && <div style={{ position: 'absolute', inset: 0, background: 'rgba(120,124,120,0.32)' }} />}

      {/* markers (HTML overlay for crisp emoji + labels) */}
      {markers.map((m, i) => (
        <div key={i} style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%,-100%)', zIndex: m.active ? 30 : 20 }}>
          <div className={m.active ? 'marker-drop' : ''} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {m.label && (
              <div style={{ marginBottom: 4, background: '#fff', borderRadius: 8, padding: '3px 9px',
                boxShadow: '0 2px 6px rgba(0,0,0,.18)', whiteSpace: 'nowrap',
                fontSize: 'calc(12px*var(--fz))', fontWeight: 700, color: m.stale ? 'var(--g500)' : 'var(--g900)' }}>
                {m.label}
              </div>
            )}
            <div style={{ position: 'relative' }}>
              {m.active && !m.stale && (
                <span className="ping-ring" style={{ position: 'absolute', inset: 0, margin: 'auto', width: 44, height: 44,
                  borderRadius: 999, background: m.color || 'var(--brand)', left: '50%', top: 20, transform: 'translateX(-50%)' }} />
              )}
              <div style={{ width: 44, height: 44, borderRadius: '50% 50% 50% 0', transform: 'rotate(45deg)',
                background: m.stale ? 'var(--g400)' : (m.color || 'var(--brand)'),
                boxShadow: '0 4px 10px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2.5px solid #fff', position: 'relative' }}>
                <span style={{ transform: 'rotate(-45deg)', fontSize: 22, filter: m.stale ? 'grayscale(1)' : 'none' }}>{m.emoji}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* start / end pins for history */}
      {children}

      {/* zoom controls */}
      {showControls && (
        <div style={{ position: 'absolute', right: 12, bottom: 16, display: 'flex', flexDirection: 'column',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.2)', zIndex: 40 }}>
          {['plus', 'minus'].map((k, i) => (
            <div key={k} style={{ width: 38, height: 38, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderBottom: i === 0 ? '1px solid var(--g200)' : 'none', color: 'var(--g700)', fontSize: 22, fontWeight: 600 }}>
              {i === 0 ? '+' : '−'}
            </div>
          ))}
        </div>
      )}
      {/* kakao-ish attribution chip */}
      {showControls && (
        <div style={{ position: 'absolute', left: 10, bottom: 12, background: 'rgba(255,255,255,.85)', borderRadius: 6,
          padding: '3px 8px', fontSize: 10, color: 'var(--g500)', fontWeight: 600, zIndex: 40 }}>지도</div>
      )}
    </div>
  );
}

// small dot pin used in history start/end
function MapDot({ x, y, color, label }) {
  return (
    <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', zIndex: 25,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ width: 18, height: 18, borderRadius: 999, background: color, border: '3px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,.3)' }} />
      {label && <span style={{ background: '#fff', borderRadius: 6, padding: '1px 6px', fontSize: 10, fontWeight: 700, color: 'var(--g800)', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }}>{label}</span>}
    </div>
  );
}

Object.assign(window, { FakeMap, MapDot });
