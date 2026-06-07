// ui.jsx — shared design-system primitives for 안심맵
// Exports global AppCtx + UI components.
const { useState, useEffect, useRef, useContext, createContext } = React;

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// status-bar inset for content under the iOS dynamic island
const TOP_INSET = 56;
const BOTTOM_INSET = 22;

/* ───────────────────────── Buttons ───────────────────────── */
function Btn({ children, onClick, variant = 'primary', size = 'md', full = true, disabled = false, icon, style = {} }) {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: full ? '100%' : 'auto',
    height: size === 'lg' ? 56 : size === 'sm' ? 40 : 48,
    padding: size === 'sm' ? '0 16px' : '0 20px',
    borderRadius: 'var(--r-sm)', fontWeight: 700,
    fontSize: size === 'lg' ? 'calc(20px*var(--fz))' : 'calc(17px*var(--fz))',
    letterSpacing: '-.01em', transition: 'all .18s cubic-bezier(.4,0,.2,1)',
  };
  const variants = {
    primary: { background: disabled ? 'var(--g300)' : 'var(--brand)', color: disabled ? 'var(--g500)' : '#fff' },
    danger:  { background: disabled ? 'var(--g300)' : 'var(--danger)', color: '#fff' },
    secondary: { background: 'var(--brand-light)', color: 'var(--brand-dark)' },
    outline: { background: '#fff', color: 'var(--g800)', border: '1.5px solid var(--g300)' },
    ghost:   { background: 'transparent', color: 'var(--brand-dark)' },
    dangerGhost: { background: '#fff', color: 'var(--danger)', border: '1.5px solid var(--danger)' },
  };
  return (
    <button className="press" onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      {icon && <Icon name={icon} size={size === 'lg' ? 24 : 20} stroke={2} />}
      {children}
    </button>
  );
}

/* ───────────────────────── Text field (fixed top label, 48px) ───────────────────────── */
function Field({ label, value, onChange, placeholder, type = 'text', maxLength, error, hint, mono, big, inputRef, onFocus }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label className="t-h3" style={{ color: 'var(--g800)' }}>{label}</label>}
      <input ref={inputRef} type={type} value={value} maxLength={maxLength}
        placeholder={placeholder}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => { setFocus(true); onFocus && onFocus(); }} onBlur={() => setFocus(false)}
        className={mono ? 'mono' : ''}
        style={{
          height: big ? 56 : 48, padding: '0 16px', width: '100%',
          fontSize: big ? 'calc(22px*var(--fz))' : 'calc(17px*var(--fz))',
          fontWeight: mono ? 700 : 500, letterSpacing: mono ? '.18em' : 0,
          textAlign: mono ? 'center' : 'left',
          borderRadius: 'var(--r-sm)', outline: 'none', color: 'var(--g900)',
          background: error ? 'var(--danger-light)' : focus ? 'var(--brand-light)' : '#fff',
          border: `1.5px solid ${error ? 'var(--danger)' : focus ? 'var(--brand)' : 'var(--g200)'}`,
          transition: 'all .15s',
        }} />
      {error && <span className="t-body-sm" style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</span>}
      {hint && !error && <span className="t-body-sm" style={{ color: 'var(--g500)' }}>{hint}</span>}
    </div>
  );
}

/* ───────────────────────── Toggle switch ───────────────────────── */
function Toggle({ on, onChange, size = 'md' }) {
  const w = size === 'lg' ? 64 : 52, h = size === 'lg' ? 36 : 30, knob = h - 6;
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on}
      style={{
        width: w, height: h, borderRadius: 999, padding: 3, flexShrink: 0,
        background: on ? 'var(--brand)' : 'var(--g300)', transition: 'background .22s',
        display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start',
      }}>
      <span style={{ width: knob, height: knob, borderRadius: 999, background: '#fff',
        boxShadow: '0 2px 5px rgba(0,0,0,.2)', transition: 'all .22s' }} />
    </button>
  );
}

/* ───────────────────────── Checkbox row ───────────────────────── */
function CheckRow({ checked, onChange, children, required }) {
  return (
    <button onClick={() => onChange(!checked)} className="press"
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '6px 0' }}>
      <span style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? 'var(--brand)' : '#fff',
        border: `2px solid ${checked ? 'var(--brand)' : 'var(--g300)'}`, transition: 'all .15s',
      }}>
        {checked && <Icon name="check" size={18} color="#fff" stroke={3} />}
      </span>
      <span className="t-body" style={{ color: 'var(--g800)', flex: 1 }}>
        {required && <b style={{ color: 'var(--brand-dark)' }}>[필수] </b>}{children}
      </span>
    </button>
  );
}

/* ───────────────────────── Radio group ───────────────────────── */
function RadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {options.map(o => {
        const sel = value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} className="press"
            style={{
              flex: 1, height: 64, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              background: sel ? 'var(--brand-light)' : '#fff',
              border: `2px solid ${sel ? 'var(--brand)' : 'var(--g200)'}`, transition: 'all .15s',
            }}>
            <span style={{ fontSize: 'calc(22px*var(--fz))' }}>{o.emoji}</span>
            <span className="t-body-sm" style={{ fontWeight: 700, color: sel ? 'var(--brand-dark)' : 'var(--g600)' }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Card ───────────────────────── */
function Card({ children, style = {}, onClick, pad = 16 }) {
  return (
    <div onClick={onClick} className={onClick ? 'press' : ''}
      style={{ background: '#fff', borderRadius: 'var(--r-lg)', padding: pad,
        boxShadow: '0 2px 8px rgba(0,0,0,.05)', ...style }}>
      {children}
    </div>
  );
}

/* ───────────────────────── Banner (info / warn / danger) ───────────────────────── */
function Banner({ tone = 'info', icon, children, action }) {
  const tones = {
    info:   { bg: 'var(--brand-light)', fg: 'var(--brand-dark)', bd: 'rgba(46,125,50,.25)' },
    warn:   { bg: '#FFF4E5', fg: '#B25E00', bd: 'rgba(178,94,0,.3)' },
    danger: { bg: 'var(--danger-light)', fg: 'var(--danger)', bd: 'rgba(211,47,47,.3)' },
    grey:   { bg: 'var(--g100)', fg: 'var(--g700)', bd: 'var(--g200)' },
  };
  const t = tones[tone];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
      background: t.bg, border: `1.5px solid ${t.bd}`, borderRadius: 'var(--r-md)' }}>
      {icon && <Icon name={icon} size={20} color={t.fg} stroke={2} style={{ flexShrink: 0 }} />}
      <span className="t-body-sm" style={{ color: t.fg, fontWeight: 600, flex: 1, lineHeight: 1.4 }}>{children}</span>
      {action}
    </div>
  );
}

/* ───────────────────────── Status pill / badge ───────────────────────── */
function Pill({ tone = 'grey', children, dot }) {
  const tones = {
    on:   { bg: 'var(--brand-light)', fg: 'var(--brand-dark)' },
    off:  { bg: 'var(--g200)', fg: 'var(--g600)' },
    danger: { bg: 'var(--danger-light)', fg: 'var(--danger)' },
    info: { bg: '#E3F2FD', fg: 'var(--info)' },
    grey: { bg: 'var(--g100)', fg: 'var(--g600)' },
  };
  const t = tones[tone];
  return (
    <span className="t-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 999, background: t.bg, color: t.fg }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: 999, background: t.fg }} />}
      {children}
    </span>
  );
}

/* ───────────────────────── Avatar (emoji persona) ───────────────────────── */
function Avatar({ emoji, size = 44, ring }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 999, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--brand-light)', fontSize: size * 0.52,
      border: ring ? `2.5px solid ${ring}` : 'none' }}>{emoji}</span>
  );
}

/* ───────────────────────── Mobile header (clears status bar) ───────────────────────── */
function MobileHeader({ title, brand, onBack, right, sub }) {
  return (
    <div style={{ paddingTop: TOP_INSET, paddingLeft: 8, paddingRight: 12, paddingBottom: 10,
      display: 'flex', alignItems: 'center', gap: 4, background: '#fff',
      borderBottom: '1px solid var(--g100)', flexShrink: 0, position: 'relative', zIndex: 5 }}>
      {onBack && (
        <button className="press" onClick={onBack} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}>
          <Icon name="back" size={24} color="var(--g800)" stroke={2.2} />
        </button>
      )}
      {brand && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingLeft: onBack ? 0 : 12 }}>
          <BrandMark size={26} />
          <span className="t-h2" style={{ color: 'var(--brand-dark)', fontWeight: 800 }}>안심맵</span>
        </div>
      )}
      {title && !brand && (
        <div style={{ paddingLeft: onBack ? 0 : 12, flex: 1 }}>
          <div className="t-h2" style={{ color: 'var(--g900)' }}>{title}</div>
          {sub && <div className="t-body-sm" style={{ color: 'var(--g500)' }}>{sub}</div>}
        </div>
      )}
      <div style={{ flex: title && !brand ? 0 : 1 }} />
      {right}
    </div>
  );
}

/* round icon button for headers */
function IconBtn({ name, onClick, color = 'var(--g700)', badge }) {
  return (
    <button className="press" onClick={onClick} style={{ width: 44, height: 44, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}>
      <Icon name={name} size={24} color={color} stroke={2} />
      {badge && <span style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 999, background: 'var(--danger)', border: '2px solid #fff' }} />}
    </button>
  );
}

/* ───────────────────────── Bottom nav (지도 / 이동기록 / 채팅) ───────────────────────── */
function BottomNav({ active, onNav }) {
  const items = [
    { key: 'family', label: '지도', icon: 'mapPin' },
    { key: 'family-history', label: '이동 기록', icon: 'route' },
    { key: 'family-chat', label: '채팅', icon: 'message' },
  ];
  return (
    <div style={{ display: 'flex', background: '#fff', borderTop: '1px solid var(--g200)',
      paddingBottom: BOTTOM_INSET, flexShrink: 0, position: 'relative', zIndex: 5 }}>
      {items.map(it => {
        const on = active === it.key;
        return (
          <button key={it.key} className="press" onClick={() => onNav(it.key)}
            style={{ flex: 1, height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <Icon name={it.icon} size={24} color={on ? 'var(--brand)' : 'var(--g500)'} stroke={on ? 2.4 : 1.9} />
            <span className="t-caption" style={{ color: on ? 'var(--brand)' : 'var(--g500)', fontWeight: on ? 700 : 600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Brand mark (logo) ───────────────────────── */
function BrandMark({ size = 40 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: 'linear-gradient(135deg,var(--brand-mint),var(--brand))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 3px 10px rgba(46,125,50,.3)' }}>
      <Icon name="shieldCheck" size={size * 0.58} color="#fff" stroke={2.2} fill="none" />
    </span>
  );
}

/* ───────────────────────── Bottom sheet (parent dialogs) ───────────────────────── */
function BottomSheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="dim-in" onClick={onClose}
      style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'flex-end' }}>
      <div className="sheet-up" onClick={e => e.stopPropagation()}
        style={{ width: '100%', background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '12px 20px calc(28px + 8px)', maxHeight: '80%', overflow: 'auto' }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: 'var(--g300)', margin: '0 auto 16px' }} />
        {children}
      </div>
    </div>
  );
}

/* ───────────────────────── Toast ───────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  const tones = { default: 'var(--g900)', danger: 'var(--danger)', success: 'var(--brand-dark)' };
  return (
    <div style={{ position: 'absolute', left: 16, right: 16, bottom: 90, zIndex: 400, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div className="dim-in" style={{ background: tones[toast.tone] || tones.default, color: '#fff',
        padding: '12px 18px', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.25)',
        maxWidth: '100%', textAlign: 'center', fontWeight: 600, fontSize: 'calc(14px*var(--fz))', lineHeight: 1.4 }}>
        {toast.msg}
      </div>
    </div>
  );
}

Object.assign(window, {
  AppCtx, useApp, TOP_INSET, BOTTOM_INSET,
  Btn, Field, Toggle, CheckRow, RadioGroup, Card, Banner, Pill, Avatar,
  MobileHeader, IconBtn, BottomNav, BrandMark, BottomSheet, Toast,
});
