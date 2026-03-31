type Project = {
  name: string
  description: string
  link: string
  video?: string
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
    link: '#',
    icon: 'Flame',
    id: 'project1',
  },
  {
    name: 'NDOS TimeKit',
    description:
      'Teamwork time-log sync and payroll export system. Syncs approved time from Teamwork API into PostgreSQL, generates fixed-width files for Advantage payroll import.',
    link: '#',
    icon: 'Clock',
    id: 'project2',
  },
  {
    name: 'NDOS MemoryKit',
    description:
      'MCP server for organizational memory. SQLite FTS5 indexing of an Obsidian vault with context bundles, full-text search, and memory extraction tools.',
    link: '#',
    icon: 'Brain',
    id: 'project4',
  },
  {
    name: 'NDOS AgentKit',
    description: 'Coming Soon',
    link: '#',
    icon: 'Bot',
    id: 'project12',
  },
]

export const CLIENT_PROJECTS: Project[] = [
  {
    name: 'HydraFacial',
    description: 'Global skincare treatment brand website.',
    link: 'https://hydrafacial.co.uk/',
    video: '/videos/HydraFacial_Hero.mp4',
    id: 'project10',
  },
  {
    name: 'OrangeTwist',
    description: 'Aesthetic treatment centers website.',
    link: 'https://orangetwist.com/',
    video: '/videos/OrangeTwist_HitPause_16x9.mp4',
    id: 'project8',
  },
  {
    name: 'CooperSurgical',
    description: 'Medical device and fertility solutions company website.',
    link: 'https://www.coopersurgical.com',
    video: '/videos/CSI_Health_Wellness_LP.mp4',
    id: 'project6',
  },
  {
    name: 'JetZero',
    description: 'Next-generation aircraft design company website.',
    link: 'https://www.jetzero.aero/',
    video: '/videos/Aircraft-page-sequence-720-final.mp4',
    id: 'project11',
  },
  {
    name: 'Near&Dear',
    description: 'Agency website',
    link: 'https://nearanddear.agency/',
    video: '/videos/N&D_Homepage_Sizzle.mp4',
    id: 'project5',
  },
  {
    name: 'Jeisys',
    description: 'Medical aesthetics technology company website.',
    link: 'https://jeisys.com/',
    video: '/videos/N&D_Jeisys_Homepage_Reel.mp4',
    id: 'project9',
  },
  {
    name: 'Sente Dashboard',
    description:
      'Social media analytics dashboard with CSV uploads, executive summaries, AI-powered insights, and multi-channel reporting.',
    link: '#',
    logo: '/sente-logo.svg',
    id: 'project3',
  },
  {
    name: 'FIDO Alliance',
    description:
      'Industry consortium developing open authentication standards.',
    link: 'https://fidoalliance.org/',
    logo: '/thumbnails/fido-logo-v2.svg',
    id: 'project7',
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
