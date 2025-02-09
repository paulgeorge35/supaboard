import { useCallback, useEffect, useState } from 'react'
import { Button } from './button'
import { Icons } from './icons'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.adminCurrentTheme) {
      return localStorage.adminCurrentTheme as 'light' | 'dark'
    }
    return 'system'
  })

  const updateTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    if (newTheme === 'system') {
      localStorage.removeItem('adminCurrentTheme')
      document.documentElement.classList.toggle(
        'dark',
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
    } else {
      localStorage.adminCurrentTheme = newTheme
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
      <Button
        type="button"
        size='icon'
        variant='outline'
        className="[&>svg]:!stroke-gray-500 dark:[&>svg]:!stroke-zinc-400 [&>svg]:!size-4"
        onClick={() => updateTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')}
      >
        {theme === 'system' ? <Icons.Monitor /> : theme === 'light' ? <Icons.Sun /> : <Icons.Moon />}
      </Button>
    </div>
  )
} 