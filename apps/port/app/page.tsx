'use client'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { XIcon, Flame, Clock, LayoutDashboard, Brain, Bot } from 'lucide-react'

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

export default function Personal() {
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
          <p className="text-zinc-600 dark:text-zinc-400">
            Expertise in full-stack development, internal product design, and
            AI-augmented workflows.
          </p>
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-2 text-lg font-medium">Near&Dear OS (NDOS)</h3>
        <p className="mb-5 text-sm text-zinc-600 dark:text-zinc-400">
          An AI-powered agentic internal operating system built for Near&Dear.
          Each kit is a modular tool that automates a core agency workflow —
          financial analytics, time tracking, social reporting, and
          organizational memory — orchestrated by AI agents that integrate with
          existing systems.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {NDOS_PROJECTS.map((project) => (
            <div key={project.name} className="px-1">
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
              <a
                className="font-base group relative inline-block font-[450] text-zinc-900 dark:text-zinc-50"
                href={project.link}
                target="_blank"
              >
                {project.name}
                <span className="absolute bottom-0.5 left-0 block h-[1px] w-full max-w-0 bg-zinc-900 transition-all duration-200 group-hover:max-w-full dark:bg-zinc-50"></span>
              </a>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {project.description}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">Client Work</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-3">
          {CLIENT_PROJECTS.map((project) => (
            <div key={project.name} className="space-y-2">
              {project.logo ? (
                <div className="px-1">
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 inline-block"
                  >
                    <img
                      src={project.logo}
                      alt={project.name}
                      className="dark:invert"
                      style={{
                        height:
                          project.name === 'FIDO Alliance' ? '3rem' : '1.5rem',
                      }}
                    />
                  </a>
                  <div className="flex items-center justify-between">
                    <a
                      className="font-base group relative inline-block font-[450] text-zinc-900 dark:text-zinc-50"
                      href={project.link}
                      target="_blank"
                    >
                      {project.name}
                      <span className="absolute bottom-0.5 left-0 block h-[1px] w-full max-w-0 bg-zinc-900 transition-all duration-200 group-hover:max-w-full dark:bg-zinc-50"></span>
                    </a>
                    <span className="text-xs text-zinc-400">
                      {project.name === 'Sente Dashboard'
                        ? 'Dashboard'
                        : 'Site Build'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {project.description}
                  </p>
                </div>
              ) : (
                <>
                  {project.video && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block rounded-2xl bg-zinc-50/40 p-1 ring-1 ring-zinc-200/50 ring-inset dark:bg-zinc-950/40 dark:ring-zinc-800/50"
                    >
                      <video
                        src={project.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="aspect-video w-full rounded-xl"
                      />
                    </a>
                  )}
                  <div className="px-1">
                    <div className="flex items-center justify-between">
                      <a
                        className="font-base group relative inline-block font-[450] text-zinc-900 dark:text-zinc-50"
                        href={project.link}
                        target="_blank"
                      >
                        {project.name}
                        <span className="absolute bottom-0.5 left-0 block h-[1px] w-full max-w-0 bg-zinc-900 transition-all duration-200 group-hover:max-w-full dark:bg-zinc-50"></span>
                      </a>
                      <span className="text-xs text-zinc-400">Site Build</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {project.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">Connect</h3>
        <p className="mb-5 text-zinc-600 dark:text-zinc-400">
          Feel free to contact me at{' '}
          <a className="underline dark:text-zinc-300" href={`mailto:${EMAIL}`}>
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
