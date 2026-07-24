import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface ThemeToggleProps {
  className?: string
}

/**
 * Botón accesible para alternar entre tema oscuro y claro. Usa `useTheme`
 * (contexto global persistido en localStorage) para leer y cambiar el tema.
 */
export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-black/[0.03] text-slate-600 transition duration-300 hover:border-cyan-400/40 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-cyan-300/30 dark:hover:text-cyan-200 ${className}`}
    >
      <Sun className={`h-[18px] w-[18px] transition-all duration-300 ${isDark ? 'hidden scale-0' : 'block scale-100'}`} />
      <Moon className={`h-[18px] w-[18px] transition-all duration-300 ${isDark ? 'block scale-100' : 'hidden scale-0'}`} />
    </button>
  )
}
