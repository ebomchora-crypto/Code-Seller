// Fitas de seda roxas do painel das telas de acesso. Cada fita é uma curva
// grossa em S com um degradê atravessando a largura (escuro → brilho →
// escuro), o que lê como tecido dobrado; como o degradê segue a linha reta e
// a fita curva, o brilho escorrega pra uma das bordas e parece torção.
// Sombras entre as camadas separam as dobras.

type Stop = [number, string]

const PROFILES: Record<'silk' | 'violet' | 'orchid', Stop[]> = {
  silk: [
    [0, '#1a1450'],
    [0.2, '#3b3494'],
    [0.38, '#7b7ae6'],
    [0.5, '#d9d8ff'],
    [0.56, '#f4f2ff'],
    [0.64, '#b5b0f7'],
    [0.8, '#5146b8'],
    [1, '#1c1352'],
  ],
  violet: [
    [0, '#1f0a45'],
    [0.25, '#5b21b6'],
    [0.42, '#8b5cf6'],
    [0.54, '#e4d8ff'],
    [0.62, '#a78bfa'],
    [0.8, '#5b21b6'],
    [1, '#1a0838'],
  ],
  orchid: [
    [0, '#2a0a33'],
    [0.3, '#9d2bb0'],
    [0.48, '#e879f9'],
    [0.54, '#ffe4ff'],
    [0.62, '#d946ef'],
    [0.8, '#701a75'],
    [1, '#22072a'],
  ],
}

interface Ribbon {
  offset: number
  thickness: number
  profile: keyof typeof PROFILES
  bend: number
  tilt: number
}

// De trás pra frente. offset = distância perpendicular ao centro do quadro.
const RIBBONS: Ribbon[] = [
  { offset: -560, thickness: 300, profile: 'silk', bend: 140, tilt: 3 },
  { offset: -360, thickness: 240, profile: 'violet', bend: -170, tilt: -2 },
  { offset: -190, thickness: 120, profile: 'orchid', bend: 120, tilt: 4 },
  { offset: -20, thickness: 320, profile: 'silk', bend: 190, tilt: 0 },
  { offset: 190, thickness: 250, profile: 'violet', bend: -150, tilt: -3 },
  { offset: 350, thickness: 110, profile: 'orchid', bend: 130, tilt: 2 },
  { offset: 500, thickness: 300, profile: 'silk', bend: -160, tilt: 4 },
  { offset: 680, thickness: 260, profile: 'violet', bend: 150, tilt: -2 },
]

const WIDTH = 700
const HEIGHT = 1000
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 }
const BASE_ANGLE = 35
const HALF_LENGTH = 950

function frame(tiltDeg: number) {
  const angle = ((BASE_ANGLE + tiltDeg) * Math.PI) / 180
  // Direção da fita (sobe pra direita) e normal (atravessa a largura).
  const dir = { x: Math.cos(angle), y: -Math.sin(angle) }
  const normal = { x: Math.sin(angle), y: Math.cos(angle) }
  return (along: number, across: number) => ({
    x: CENTER.x + dir.x * along + normal.x * across,
    y: CENTER.y + dir.y * along + normal.y * across,
  })
}

const fmt = (p: { x: number; y: number }) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`

export function SilkRibbons({ className = '' }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        {RIBBONS.map((ribbon, index) => {
          const point = frame(ribbon.tilt)
          const from = point(0, ribbon.offset - ribbon.thickness / 2)
          const to = point(0, ribbon.offset + ribbon.thickness / 2)
          return (
            <linearGradient
              key={index}
              id={`silk-${index}`}
              gradientUnits="userSpaceOnUse"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            >
              {PROFILES[ribbon.profile].map(([stop, color]) => (
                <stop key={stop} offset={stop} stopColor={color} />
              ))}
            </linearGradient>
          )
        })}
        <filter id="silk-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="-8" dy="-12" stdDeviation="16" floodColor="#07021a" floodOpacity="0.5" />
        </filter>
        <radialGradient id="silk-sheen" cx="72%" cy="28%" r="75%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="#120c36" />

      {RIBBONS.map((ribbon, index) => {
        const point = frame(ribbon.tilt)
        const start = point(-HALF_LENGTH, ribbon.offset)
        const control1 = point(-HALF_LENGTH / 3, ribbon.offset + ribbon.bend)
        const control2 = point(HALF_LENGTH / 3, ribbon.offset - ribbon.bend)
        const end = point(HALF_LENGTH, ribbon.offset)
        return (
          <path
            key={index}
            d={`M ${fmt(start)} C ${fmt(control1)}, ${fmt(control2)}, ${fmt(end)}`}
            fill="none"
            stroke={`url(#silk-${index})`}
            strokeWidth={ribbon.thickness}
            filter="url(#silk-shadow)"
          />
        )
      })}

      <rect width={WIDTH} height={HEIGHT} fill="url(#silk-sheen)" />
    </svg>
  )
}
