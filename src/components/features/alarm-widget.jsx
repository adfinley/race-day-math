import { useState, useEffect } from 'react';
import { formatTime12h, formatPeriod } from '../../lib/time-utils';
import { C, PRI, SEC } from '../../lib/colours';


// ── Odometer digit ────────────────────────────────────────────────
function OdometerDigit({ value, color, fontSize, fontWeight = 900, fixedWidth, fontFamily }) {
  const [current, setCurrent] = useState(value);
  const [prev, setPrev] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (value !== current) {
      setPrev(current);
      setCurrent(value);
      setAnimKey(k => k + 1);
      const t = setTimeout(() => setPrev(null), 400);
      return () => clearTimeout(t);
    }
  }, [value]);

  const ff = fontFamily || PRI;

  const containerStyle = {
    display: 'inline-block',
    position: 'relative',
    overflow: 'visible',
    verticalAlign: 'top',
    lineHeight: 1,
    width: fixedWidth || undefined,
    textAlign: 'center',
  };

  const digitStyle = {
    fontFamily: ff,
    fontSize,
    fontWeight,
    color,
    lineHeight: 1,
    display: 'block',
    textAlign: 'center',
    textShadow: '0 0 8px rgba(255,255,255,0.24)',
  };

  return (
    <span style={containerStyle}>
      <span style={{ display: 'block', position: 'relative', overflow: 'hidden', width: fixedWidth || undefined, lineHeight: 1 }}>
        {prev !== null && (
          <span key={`out-${animKey}`} style={{
            ...digitStyle,
            position: 'absolute', top: 0, left: 0, right: 0,
            animation: 'odometerSlideOut 0.35s cubic-bezier(0.4,0,1,1) forwards',
          }}>{prev}</span>
        )}
        <span key={`in-${animKey}`} style={{
          ...digitStyle,
          animation: animKey > 0 ? 'odometerSlideIn 0.35s cubic-bezier(0,0,0.2,1) forwards' : 'none',
          ...(animKey > 0 ? { transform: 'translateY(-100%)', opacity: 0 } : {}),
        }}>{current}</span>
      </span>
    </span>
  );
}

const AlarmSVG = () => (
  <svg width={16} height={16} viewBox="0 0 32 32" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M16 29C22.6274 29 28 23.6274 28 17C28 10.3726 22.6274 5 16 5C9.37258 5 4 10.3726 4 17C4 23.6274 9.37258 29 16 29ZM16 27C21.5228 27 26 22.5228 26 17C26 11.4772 21.5228 7 16 7C10.4772 7 6 11.4772 6 17C6 22.5228 10.4772 27 16 27Z" fill="white"/>
    <path d="M16 10C16.5523 10 17 10.4477 17 11V16.5858L20.2929 19.8787C20.6834 20.2692 20.6834 20.9024 20.2929 21.2929C19.9024 21.6834 19.2692 21.6834 18.8787 21.2929L15.2929 17.7071C15.1054 17.5196 15 17.2652 15 17V11C15 10.4477 15.4477 10 16 10Z" fill="white"/>
    <path d="M5.29289 4.29289C5.68342 3.90237 6.31658 3.90237 6.70711 4.29289L9.70711 7.29289C10.0976 7.68342 10.0976 8.31658 9.70711 8.70711C9.31658 9.09763 8.68342 9.09763 8.29289 8.70711L5.29289 5.70711C4.90237 5.31658 4.90237 4.68342 5.29289 4.29289Z" fill="white"/>
    <path d="M26.7071 4.29289C26.3166 3.90237 25.6834 3.90237 25.2929 4.29289L22.2929 7.29289C21.9024 7.68342 21.9024 8.31658 22.2929 8.70711C22.6834 9.09763 23.3166 9.09763 23.7071 8.70711L26.7071 5.70711C27.0976 5.31658 27.0976 4.68342 26.7071 4.29289Z" fill="white"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────
// Colon style overrides — edit these to change the colon appearance
// ─────────────────────────────────────────────────────────────────
const COLON_FONT_FAMILY = `'DM Sans', sans-serif`;
const COLON_FONT_SIZE   = '56px';
const COLON_FONT_WEIGHT = 900;
const COLON_LINE_HEIGHT = '48px';
const COLON_FIXED_WIDTH = '22px';
// ─────────────────────────────────────────────────────────────────

// Digit dimensions for the number characters
const DIGIT_FONT_SIZE  = '56px';
const DIGIT_FONT_WEIGHT = 900;
const DIGIT_FIXED_WIDTH = '48px';

export default function AlarmWidget({
  wakeUpTime,
  isXsInline = false,
  isXlCol = false,
}) {
  const rawTime = wakeUpTime || '05:50';
  const period = formatPeriod(rawTime);

  const [hStr, mStr] = rawTime.split(':');
  const h24 = parseInt(hStr, 10);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const timeStr = `${String(h12).padStart(2, '0')}:${mStr}`;

  const widgetProps = { timeStr, period };

  // XS inline: lives in document flow, sticky to bottom of viewport.
  if (isXsInline) {
    return <WidgetContent {...widgetProps} />;
  }

  // XL column: sticky positioning applied inline (no dependency on .rdm-alarm-xl-col CSS)
  if (isXlCol) {
    return <WidgetContent {...widgetProps} sticky />;
  }

  return null;
}

function WidgetContent({ timeStr, period, sticky }) {
  const innerBase = { background: '#2E2E2E', borderRadius: 20 };

  return (
    <div style={{
      background: '#212121',
      borderRadius: 26,
      padding: 8,
      display: 'flex',
      gap: 8,
      ...(sticky ? { position: 'sticky', top: 76, boxShadow: '0 8px 18px rgba(0,0,0,0.15)' } : {}),
    }}>
     
      <div style={{ ...innerBase, padding: '6px 7px 0px 4px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0, marginLeft:4 }}>
          <AlarmSVG/>
          <span style={{ fontFamily: SEC, fontSize: 14, color: C.grey2, fontWeight: 400, lineHeight: 1 }}>
            Set your alarm for:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', lineHeight: 1, marginBottom: 0 }}>
          {timeStr.split('').map((ch, i) => {
            const isColon = ch === ':';
            return (
              <OdometerDigit
                key={i}
                value={ch}
                color="#F5F3F4"
                fontSize={isColon ? COLON_FONT_SIZE : DIGIT_FONT_SIZE}
                fontWeight={isColon ? COLON_FONT_WEIGHT : DIGIT_FONT_WEIGHT}
                fontFamily={isColon ? COLON_FONT_FAMILY : undefined}
                fixedWidth={isColon ? COLON_FIXED_WIDTH : DIGIT_FIXED_WIDTH}
              />
            );
          })}
          {/* Stacked AM/PM column — AM on top, PM on bottom; only active one is visible */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: 2,
            marginBottom: 6,
            marginLeft: 6,
          }}>
            {['AM', 'PM'].map(p => (
              <span key={p} style={{
                fontFamily: `'Orbitron', sans-serif`,
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1,
                color: '#F5F3F4',
                opacity: period === p ? 1 : 0,
                transition: 'opacity 1.2s ease',
                pointerEvents: 'none',
              }}>{p}</span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}