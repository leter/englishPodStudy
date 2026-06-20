export type Theme = 'light' | 'dark'

type ThemeToggleProps = {
  theme: Theme
  onToggle: () => void
  className?: string
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />
    </svg>
  )
}

export function ThemeToggle({ theme, onToggle, className = 'theme-toggle' }: ThemeToggleProps) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={className}
      aria-label={isDark ? '当前暗色主题，点击切换为亮色' : '当前亮色主题，点击切换为暗色'}
      title={isDark ? '切换到亮色' : '切换到暗色'}
      onClick={onToggle}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
