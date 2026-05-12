type Project = {
  name: string
  description: string
  link: string
  video?: string
  thumbnail?: string
  icon?: string
  logo?: string
  id: string
}

type SocialLink = {
  label: string
  link: string
}

export const NDOS_PROJECTS: Project[] = [
  {
    name: 'NDOS BurnKit',
    description:
      'Financial analytics dashboard tracking burn rate, billable hours, project profitability, and team utilization.',
    link: '/burnkit',
    icon: 'Flame',
    id: 'project1',
  },
  {
    name: 'NDOS TimeKit',
    description:
      'Teamwork time-log sync and payroll export system. Syncs approved time from Teamwork API into PostgreSQL, generates fixed-width files for Advantage payroll import.',
    link: '/timekit',
    icon: 'Clock',
    id: 'project2',
  },
  {
    name: 'NDOS MemoryKit',
    description:
      'MCP server for organizational memory. SQLite FTS5 indexing of an Obsidian vault with context bundles, full-text search, and memory extraction tools.',
    link: '/memorykit',
    icon: 'Brain',
    id: 'project4',
  },
  {
    name: 'NDOS AgentKit',
    description: 'Coming Soon...',
    link: '#',
    icon: 'Bot',
    id: 'project12',
  },
]

export const CLIENT_PROJECTS: Project[] = [
  {
    name: 'HydraFacial',
    description: 'Global skincare treatment.',
    link: 'https://hydrafacial.co.uk/',
    video: '/videos/HydraFacial_Hero.mp4',
    id: 'project10',
  },
  {
    name: 'OrangeTwist',
    description: 'Aesthetic treatment centers.',
    link: 'https://orangetwist.com/',
    video: '/videos/OrangeTwist_HitPause_16x9.mp4',
    id: 'project8',
  },
  {
    name: 'JetZero',
    description: 'Next-generation all-wing aircraft design.',
    link: 'https://www.jetzero.aero/',
    video: '/videos/jetzero-united-compressed.mp4',
    id: 'project11',
  },
  {
    name: 'Near&Dear',
    description: 'Marketing agency focused on human vitality.',
    link: 'https://nearanddear.agency/',
    video: '/videos/N&D_Homepage_Sizzle.mp4',
    id: 'project5',
  },
  {
    name: 'Sentelabs',
    description:
      'Custom analytics dashboard with CSV uploads, summaries, and AI-powered insights.',
    link: '/sente',
    video: '/videos/sente-compressed.mp4',
    id: 'project3',
  },
  {
    name: 'Jeisys',
    description:
      'Korea-born aesthetics brand with 25 years of R&D and clinical innovation trusted around the world.',
    link: 'https://www.jeisys-us.com/',
    video: '/videos/N&D_Jeisys_Homepage_Reel.mp4',
    id: 'project9',
  },
  {
    name: 'FIDO Alliance',
    description: 'Authentication standards promoting the adoption of passkeys.',
    link: 'https://fidoalliance.org/',
    video: '/videos/fido-alliance-compressed.mp4',
    id: 'project7',
  },
  {
    name: 'CooperSurgical',
    description: 'Medical device and fertility solutions.',
    link: 'https://www.coopersurgical.com',
    video: '/videos/CSI_Health_Wellness_LP.mp4',
    id: 'project6',
  },
]

export const PERSONAL_PROJECTS: Project[] = [
  {
    name: 'Financial Cabinet',
    description:
      'Dashboard tracking disclosed financial transactions from federal cabinet officials — filings, most-traded tickers, and late-filing rates.',
    link: 'https://financial-cabinet.vercel.app/',
    thumbnail: '/thumbnails/fc.png',
    id: 'personal3',
  },
  {
    name: 'Miniaturize',
    description:
      'A local two-piece tool for turning an Instagram photo into AI-generated "miniature architectural scale model" renders.',
    link: '#',
    video: '/videos/miniaturize-compressed.mp4',
    id: 'personal2',
  },
  {
    name: 'Explain That Strategy',
    description:
      "Break down pit stops, tire strategies, safety car calls, and weather crossovers from every Formula 1 race since 2018 — then simulate the alternatives the team didn't take.",
    link: '#',
    video: '/videos/explain-that-strategy.mp4',
    id: 'personal1',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Github',
    link: 'https://github.com/vibrains',
  },
  {
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/in/emilianoborzelli/',
  },
  {
    label: 'CV',
    link: '/Emiliano-Borzelli-Resume.pdf',
  },
]

export const EMAIL = 'emilianoborzelli@gmail.com'
