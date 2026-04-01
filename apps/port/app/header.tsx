'use client'
import { TextEffect } from '@/components/ui/text-effect'
import Link from 'next/link'

export function Header() {
  return (
    <header className="mb-8 flex items-center justify-between">
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
          className="block text-zinc-600 dark:text-zinc-500"
          delay={0.2}
        >
          Director of Technology
        </TextEffect>
      </div>
    </header>
  )
}
