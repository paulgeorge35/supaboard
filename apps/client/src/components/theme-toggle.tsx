import { useCallback, useEffect, useState } from 'react'

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
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => updateTheme('light')}
        className={`px-3 py-1 rounded ${
          theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => updateTheme('dark')}
        className={`px-3 py-1 rounded ${
          theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={() => updateTheme('system')}
        className={`px-3 py-1 rounded ${
          theme === 'system' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        System
      </button>
    </div>
  )
} 