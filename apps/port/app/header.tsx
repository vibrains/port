'use client'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const THEMES_OPTIONS = [
  { label: 'Light', id: 'light', icon: <SunIcon className="h-4 w-4" /> },
  { label: 'Dark', id: 'dark', icon: <MoonIcon className="h-4 w-4" /> },
  { label: 'System', id: 'system', icon: <MonitorIcon className="h-4 w-4" /> },
]

function ThemeSwitch() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-center gap-0">
      <AnimatedBackground
        className="pointer-events-none rounded-lg bg-zinc-100 dark:bg-zinc-800"
        defaultValue={theme}
        transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
        enableHover={false}
        onValueChange={(id) => setTheme(id as string)}
      >
        {THEMES_OPTIONS.map((t) => (
          <button
            key={t.id}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center text-zinc-500 transition-colors duration-100 focus-visible:outline-2 data-[checked=true]:text-zinc-950 dark:text-zinc-400 dark:data-[checked=true]:text-zinc-50"
            type="button"
            aria-label={`Switch to ${t.label} theme`}
            data-id={t.id}
          >
            {t.icon}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  )
}

export function Header() {
  return (
    <header className="mb-8">
      <div className="mb-2 flex justify-end">
        <ThemeSwitch />
      </div>
      <div>
        <Link href="/" className="font-medium text-black dark:text-white">
          <TextEffect as="span" preset="fade" per="char" delay={0}>
            Emiliano Borzelli
          </TextEffect>
        </Link>
        <TextEffect
          as="span"
          preset="fade"
          per="char"
          className="block text-zinc-600 dark:text-zinc-200"
          delay={0.2}
        >
          Director of Technology
        </TextEffect>
      </div>
    </header>
  )
}
