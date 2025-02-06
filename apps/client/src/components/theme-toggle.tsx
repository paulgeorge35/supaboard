import { useCallback, useEffect, useState } from 'react'
import { Icons } from './icons'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.currentTheme) {
      return localStorage.currentTheme as 'light' | 'dark'
    }
    return 'system'
  })

  const updateTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    if (newTheme === 'system') {
      localStorage.removeItem('currentTheme')
      document.documentElement.classList.toggle(
        'dark',
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
    } else {
      localStorage.currentTheme = newTheme
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
    setTheme(newTheme)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches)
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <div className="relative">
      <button
        type="button"
        className="button button-small button-primary aspect-square size-8"
        data-popover-trigger
        aria-expanded="false"
        aria-haspopup="true"
      >
        {theme === 'system' ? <Icons.Monitor /> : theme === 'light' ? <Icons.Sun /> : <Icons.Moon />}
      </button>

      <div
        className="absolute right-0 top-full mt-2 w-20 rounded-md bg-white dark:bg-zinc-900 shadow-sm border dark:border-zinc-800 ring-opacity-5 hidden"
        data-popover
        role="menu"
      >
        <div className="py-1" role="none">
          <button onClick={() => updateTheme('light')} type="button" className="w-full px-2 py-1 text-xs horizontal center-v gap-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20" role="menuitem">
            <Icons.Sun size={16} /> Light
          </button>
          <button onClick={() => updateTheme('dark')} type="button" className="w-full px-2 py-1 text-xs horizontal center-v gap-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20" role="menuitem">
            <Icons.Moon size={16} /> Dark
          </button>
          <button onClick={() => updateTheme('system')} type="button" className="w-full px-2 py-1 text-xs horizontal center-v gap-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20" role="menuitem">
            <Icons.Monitor size={16} /> System
          </button>
        </div>
      </div>
    </div>
  )
} 