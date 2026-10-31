/* Shared SVG symbols: Rasvani mark (bowl + steam), petal pattern (decorative), veg mark, diya. Mounted once in the layout. */
const FULL = [0, 45, 90, 135, 180, 225, 270, 315];
const BACK = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

export function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <path id="petal" d="M0,-55 C95,-150 95,-290 0,-385 C-95,-290 -95,-150 0,-55Z" />
        <path id="petal-b" d="M0,-55 C70,-120 80,-190 0,-250 C-80,-190 -70,-120 0,-55Z" />
        <path id="petal-s" d="M0,-40 C110,-150 110,-290 0,-390 C-110,-290 -110,-150 0,-40Z" />
        <path id="petal-sb" d="M0,-40 C80,-120 90,-190 0,-260 C-90,-190 -80,-120 0,-40Z" />
      </defs>
      <symbol id="mark" viewBox="0 0 200 200">
        <g fill="var(--mark-front,#d9a441)" stroke="var(--mark-front,#d9a441)">
          <g className="mark-steam" fill="none" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
            <path d="M70 104 C54 92 56 80 68 70 C80 60 80 48 68 38" />
            <path d="M104 98 C118 82 118 56 104 40" />
            <path d="M128 106 C150 84 150 54 128 32" />
          </g>
          <path d="M30 118 H170 C170 158 140 180 100 180 C60 180 30 158 30 118 Z" />
          <rect x="74" y="186" width="52" height="10" rx="5" />
        </g>
      </symbol>
      <symbol id="mark-s" viewBox="0 0 800 800">
        <g transform="translate(400 400)" fill="currentColor">
          {BACK.map((r) => (
            <use key={r} href="#petal-sb" transform={`rotate(${r})`} />
          ))}
          {FULL.map((r) => (
            <use key={r} href="#petal-s" transform={`rotate(${r})`} />
          ))}
        </g>
      </symbol>
      <symbol id="veg" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="5.5" fill="currentColor" />
      </symbol>
      <symbol id="diya" viewBox="0 0 120 90">
        <path d="M60 4 C70 18 74 28 60 40 C46 28 50 18 60 4Z" fill="#e8c56e" />
        <path d="M8 46 C8 46 30 44 60 44 C90 44 112 46 112 46 C108 70 86 84 60 84 C34 84 12 70 8 46Z" fill="#d9a441" />
        <path d="M22 54 C40 60 80 60 98 54" stroke="#4a0f17" strokeOpacity=".35" strokeWidth="3" fill="none" strokeLinecap="round" />
      </symbol>
    </svg>
  );
}

export function Mark({ className, simple }: { className?: string; simple?: boolean }) {
  return (
    <svg className={className} viewBox={simple ? '0 0 800 800' : '0 0 200 200'} aria-hidden="true">
      <use href={simple ? '#mark-s' : '#mark'} />
    </svg>
  );
}

export function Logo() {
  return (
    <>
      <Mark className="logo__mark" />
      <span className="logo__word">Rasvani</span>
    </>
  );
}
