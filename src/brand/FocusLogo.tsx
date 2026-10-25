/** 焦点影视实训基地 — 镜头对焦标识 */
type FocusLogoProps = {
  size?: number
  /** light: 深色底上的白标；dark: 浅色底上的彩标 */
  tone?: 'light' | 'dark'
}

export function FocusLogo({ size = 28, tone = 'dark' }: FocusLogoProps) {
  const isLight = tone === 'light'
  const bg = isLight ? 'rgba(255,255,255,0.16)' : 'url(#focusGrad)'
  const ring = isLight ? 'rgba(255,255,255,0.92)' : '#F5E6C8'
  const core = isLight ? '#fff' : '#C45C26'
  const blade = isLight ? 'rgba(255,255,255,0.55)' : 'rgba(245,230,200,0.35)'

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      {!isLight ? (
        <defs>
          <linearGradient id="focusGrad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1A1A1A" />
            <stop offset="1" stopColor="#2C1810" />
          </linearGradient>
        </defs>
      ) : null}
      <rect width="32" height="32" rx="8" fill={bg} />
      {/* 光圈叶片暗示 */}
      <path d="M16 5.5 L19.2 11.2 L16 10.2 L12.8 11.2 Z" fill={blade} />
      <path d="M26.5 16 L20.8 19.2 L21.8 16 L20.8 12.8 Z" fill={blade} />
      <path d="M16 26.5 L12.8 20.8 L16 21.8 L19.2 20.8 Z" fill={blade} />
      <path d="M5.5 16 L11.2 12.8 L10.2 16 L11.2 19.2 Z" fill={blade} />
      {/* 外环 */}
      <circle cx="16" cy="16" r="8.2" stroke={ring} strokeWidth="1.6" fill="none" />
      <circle cx="16" cy="16" r="5.4" stroke={ring} strokeWidth="1" fill="none" opacity="0.55" />
      {/* 焦点 */}
      <circle cx="16" cy="16" r="2.2" fill={core} />
      {/* 十字对焦 */}
      <path
        d="M16 9.2 V11.6 M16 20.4 V22.8 M9.2 16 H11.6 M20.4 16 H22.8"
        stroke={ring}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export const ORG_NAME = '焦点影视实训基地'
export const ORG_SHORT = '焦点影视'
