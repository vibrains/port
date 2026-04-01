'use client'
import { TextEffect } from '@/components/ui/text-effect'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { XIcon, Flame, Clock, LayoutDashboard, Brain, Bot } from 'lucide-react'

function ExternalLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-400 dark:text-zinc-500">
      <path d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    </svg>
  )
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame,
  Clock,
  LayoutDashboard,
  Brain,
  Bot,
}

function ProjectIcon({ name }: { name: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const Icon = ICON_MAP[name]
  if (!Icon) return null
  return <Icon className="h-4 w-4" />
}
import { Magnetic } from '@/components/ui/magnetic'
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogContainer,
} from '@/components/ui/morphing-dialog'
import { NDOS_PROJECTS, CLIENT_PROJECTS, EMAIL, SOCIAL_LINKS } from './data'

const VARIANTS_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const VARIANTS_SECTION = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const TRANSITION_SECTION = {
  duration: 0.3,
}

type ProjectVideoProps = {
  src: string
}

function ProjectVideo({ src }: ProjectVideoProps) {
  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        bounce: 0,
        duration: 0.3,
      }}
    >
      <MorphingDialogTrigger>
        <video
          src={src}
          autoPlay
          loop
          muted
          className="aspect-video w-full cursor-zoom-in rounded-xl"
        />
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="relative aspect-video rounded-2xl bg-zinc-50 p-1 ring-1 ring-zinc-200/50 ring-inset dark:bg-zinc-950 dark:ring-zinc-800/50">
          <video
            src={src}
            autoPlay
            loop
            muted
            className="aspect-video h-[50vh] w-full rounded-xl md:h-[70vh]"
          />
        </MorphingDialogContent>
        <MorphingDialogClose
          className="fixed top-6 right-6 h-fit w-fit rounded-full bg-white p-1"
          variants={{
            initial: { opacity: 0 },
            animate: {
              opacity: 1,
              transition: { delay: 0.3, duration: 0.1 },
            },
            exit: { opacity: 0, transition: { duration: 0 } },
          }}
        >
          <XIcon className="h-5 w-5 text-zinc-500" />
        </MorphingDialogClose>
      </MorphingDialogContainer>
    </MorphingDialog>
  )
}

function MagneticSocialLink({
  children,
  link,
}: {
  children: React.ReactNode
  link: string
}) {
  return (
    <Magnetic springOptions={{ bounce: 0 }} intensity={0.3}>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex shrink-0 items-center gap-[1px] rounded-full bg-zinc-100 px-2.5 py-1 text-sm text-black transition-colors duration-200 hover:bg-zinc-950 hover:text-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {children}
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
        >
          <path
            d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
      </a>
    </Magnetic>
  )
}

function ClientProjectCard({ project, activeVideoRef }: { project: { name: string; description: string; link: string; video?: string; logo?: string }; activeVideoRef: React.MutableRefObject<HTMLVideoElement | null> }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/card relative block overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:shadow-zinc-900${project.name === 'JetZero' ? ' sm:col-span-2' : ''}`}
      onMouseEnter={() => {
        if (videoRef.current) {
          if (activeVideoRef.current && activeVideoRef.current !== videoRef.current) {
            activeVideoRef.current.pause()
          }
          activeVideoRef.current = videoRef.current
          videoRef.current.play()
        }
      }}
    >
      <span className="absolute top-3 right-3 z-10 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
        <ExternalLinkIcon />
      </span>
      {project.logo ? (
        <div className="p-4">
          <img
            src={project.logo}
            alt={project.name}
            className="mb-3 dark:invert"
            style={{
              height: project.name === 'FIDO Alliance' ? '3rem' : '1.5rem',
            }}
          />
          <div className="flex items-center justify-between">
            <span className="font-base font-[450] text-zinc-900 dark:text-zinc-50">
              {project.name}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {project.name === 'Sente Dashboard' ? 'Dashboard' : 'Site Build'}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-200">
            {project.description}
          </p>
        </div>
      ) : (
        <>
          {project.video && (
            <div className="relative">
              <video
                ref={videoRef}
                src={project.video}
                loop
                muted
                playsInline
                className="aspect-video w-full"
              />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-white/80 px-2 py-0.5 text-xs text-zinc-600 backdrop-blur-sm dark:bg-zinc-900/80 dark:text-zinc-400">
                Site Build
              </span>
            </div>
          )}
          <div className="p-4">
            <span className="font-base font-[450] text-zinc-900 dark:text-zinc-50">
              {project.name}
            </span>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-200">
              {project.description}
            </p>
          </div>
        </>
      )}
    </a>
  )
}

export default function Personal() {
  const activeVideoRef = useRef<HTMLVideoElement | null>(null)

  return (
    <motion.main
      className="space-y-24"
      variants={VARIANTS_CONTAINER}
      initial="hidden"
      animate="visible"
    >
      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <div className="flex-1">
          <TextEffect
            as="p"
            preset="fade"
            per="char"
            delay={0.3}
            className="text-zinc-600 dark:text-zinc-200"
          >
            Expertise in full-stack development, internal product design, and
            AI-augmented workflows.
          </TextEffect>
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
        className="border-t border-zinc-200 pt-8 dark:border-zinc-700"
      >
        <h3 className="mb-2 text-lg font-medium">● Near&Dear OS (NDOS)</h3>
        <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-200">
          AI-powered agentic operating system built for Near&Dear. Each kit is a
          modular tool that automates a core agency workflow — financial
          analytics, time tracking, social reporting, and organizational memory
          — orchestrated by AI agents that integrate with existing systems.
        </p>
        <div className="grid grid-cols-1 gap-x-20 gap-y-6 sm:grid-cols-2">
          {NDOS_PROJECTS.map((project) => {
            const content = (
              <>
                {project.icon && ICON_MAP[project.icon] ? (
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                    <ProjectIcon name={project.icon} />
                  </div>
                ) : project.logo ? (
                  <img
                    src={project.logo}
                    alt={project.name}
                    className="mb-3 h-6 dark:invert"
                  />
                ) : null}
                <span className="font-base font-[450] text-zinc-900 dark:text-zinc-50">
                  {project.name}
                </span>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-200">
                  {project.description}
                </p>
              </>
            )

            const className = "group/card relative block rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:shadow-zinc-900"

            return project.link !== '#' ? (
              <a key={project.name} href={project.link} target="_blank" className={className}>
                <span className="absolute top-3 right-3 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
                  <ExternalLinkIcon />
                </span>
                {content}
              </a>
            ) : (
              <div key={project.name} className="relative block rounded-xl border border-zinc-200 bg-white p-4 opacity-60 dark:border-zinc-700 dark:bg-zinc-900">
                {content}
              </div>
            )
          })}
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
        className="border-t border-zinc-200 pt-8 dark:border-zinc-700"
      >
        <h3 className="mb-5 text-lg font-medium">● Client Work</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-3">
          {CLIENT_PROJECTS.map((project) => (
            <ClientProjectCard key={project.name} project={project} activeVideoRef={activeVideoRef} />
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
        className="border-t border-zinc-200 pt-8 dark:border-zinc-700"
      >
        <h3 className="mb-5 text-lg font-medium">● Connect</h3>
        <p className="mb-5 text-zinc-600 dark:text-zinc-400">
          Feel free to contact me at{' '}
          <a className="underline underline-offset-2 dark:text-zinc-300" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </p>
        <div className="flex items-center justify-start space-x-3">
          {SOCIAL_LINKS.map((link) => (
            <MagneticSocialLink key={link.label} link={link.link}>
              {link.label}
            </MagneticSocialLink>
          ))}
        </div>
      </motion.section>
    </motion.main>
  )
}
