// ---------------------------------------------------------------------------
// MemoryKit Demo – Mock Data
// All data is fictional. Used exclusively for the interactive portfolio demo.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface SearchResult {
  path: string
  title: string
  client: string
  type: string
  created: string
  provenance: string
  excerpt: string
  rank: number
}

export interface MemoryEntry {
  id: string
  title: string
  client: string
  type:
    | 'decision'
    | 'preference'
    | 'constraint'
    | 'fact'
    | 'competitive-intel'
    | 'relationship'
    | 'other'
  status: 'pending' | 'approved' | 'rejected'
  submitted: string
  provenance: string
  confidence?: 'high' | 'medium'
  content: string
}

export interface ClientContext {
  name: string
  brandVoice: string
  positioning: string
  constraints: string
  decisions: {
    title: string
    date: string
    content: string
    provenance: string
  }[]
  meetings: { title: string; date: string; summary: string }[]
}

export interface Tool {
  name: string
  description: string
  inputSchema: {
    name: string
    type: string
    required: boolean
    description: string
  }[]
}

// ---- Tools ----------------------------------------------------------------

export const TOOLS: Tool[] = [
  {
    name: 'get_client_context',
    description:
      'Retrieve the full context bundle for a specific client, including brand voice, positioning, constraints, and optionally their decision history and meeting notes. Use this at the start of any client-specific task to ground your work in what the agency already knows.',
    inputSchema: [
      {
        name: 'client_name',
        type: 'string',
        required: true,
        description: 'The client name exactly as it appears in the memory system (e.g. "Acme Wellness").',
      },
      {
        name: 'include_meetings',
        type: 'boolean',
        required: false,
        description: 'Include recent meeting summaries in the response. Defaults to true.',
      },
      {
        name: 'include_decisions',
        type: 'boolean',
        required: false,
        description: 'Include the decision log in the response. Defaults to true.',
      },
    ],
  },
  {
    name: 'get_agency_context',
    description:
      'Retrieve Near&Dear agency-level context: voice & tone guidelines, process playbooks, team structure, and cross-client standards. Useful when you need to align output with the agency\'s own brand or workflows rather than a specific client.',
    inputSchema: [
      {
        name: 'sections',
        type: 'string[]',
        required: false,
        description:
          'Optionally limit the response to specific sections. Valid values: "voice", "process", "team", "standards". Omit to receive all sections.',
      },
    ],
  },
  {
    name: 'get_industry_context',
    description:
      'Retrieve shared industry knowledge for the human-vitality vertical: regulatory landscape (FDA/FTC), market trends, competitive dynamics, and audience insights. This context applies across all clients in the portfolio.',
    inputSchema: [],
  },
  {
    name: 'search_context',
    description:
      'Full-text search across all stored memories, meeting notes, briefs, and decision logs. Returns ranked results with excerpts. Use this when you need to find a specific piece of information but are not sure where it lives.',
    inputSchema: [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'Natural-language search query (e.g. "influencer guidelines for Lumina").',
      },
      {
        name: 'client',
        type: 'string',
        required: false,
        description: 'Filter results to a single client.',
      },
      {
        name: 'type',
        type: 'string',
        required: false,
        description:
          'Filter by memory type: "decision", "meeting", "brief", "constraint", "preference", "fact".',
      },
      {
        name: 'since_days',
        type: 'number',
        required: false,
        description: 'Only return results created within the last N days.',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of results to return. Defaults to 10.',
      },
    ],
  },
  {
    name: 'suggest_memory',
    description:
      'Submit a single new memory entry for human review. The entry will appear in the approval queue before being persisted. Use this when a conversation reveals a new decision, preference, or fact worth remembering.',
    inputSchema: [
      {
        name: 'client_name',
        type: 'string',
        required: true,
        description: 'The client this memory belongs to.',
      },
      {
        name: 'title',
        type: 'string',
        required: true,
        description: 'Short, descriptive title for the memory entry.',
      },
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'The full content of the memory. Be specific and include context.',
      },
      {
        name: 'type',
        type: 'string',
        required: true,
        description:
          'Memory type: "decision", "preference", "constraint", "fact", "competitive-intel", "relationship", or "other".',
      },
      {
        name: 'provenance',
        type: 'string',
        required: true,
        description:
          'Where this information came from (e.g. "Q1 strategy call", "Slack #acme-wellness 2025-01-14").',
      },
    ],
  },
  {
    name: 'extract_memory',
    description:
      'Batch-submit multiple memory entries extracted from a single source (e.g. a meeting transcript or strategy document). All items enter the approval queue. Use this after processing a long document to capture everything at once.',
    inputSchema: [
      {
        name: 'client_name',
        type: 'string',
        required: true,
        description: 'The client these memories belong to.',
      },
      {
        name: 'items',
        type: 'array',
        required: true,
        description:
          'Array of memory objects, each with: title (string), content (string), type (string), provenance (string), confidence ("high" | "medium").',
      },
    ],
  },
]

// ---- Client Contexts ------------------------------------------------------

export const CLIENTS: Record<string, ClientContext> = {
  'Acme Wellness': {
    name: 'Acme Wellness',
    brandVoice: `Acme Wellness speaks with quiet authority. The tone is warm but never casual — think trusted advisor, not best friend. Every sentence should feel like it was written by someone who has spent years studying the science and genuinely cares about the reader's wellbeing.

Avoid hype language ("revolutionary", "game-changing", "miracle"). Instead lean on specificity: cite the mechanism, name the ingredient, reference the study. Confidence comes from evidence, not exclamation marks.

The brand uses the second person ("you") generously. First person plural ("we") is reserved for behind-the-scenes storytelling — sourcing trips, lab partnerships, formulation decisions. Never use "I."

Humor is welcome when it feels effortless — a wry aside, a knowing nod — but never at the expense of credibility. The reader should finish every piece feeling more informed and slightly more optimistic about their health.`,
    positioning: `Acme Wellness occupies the premium-but-accessible tier of the supplement market. The brand sits between clinical brands (Pure Encapsulations, Thorne) and lifestyle wellness brands (Ritual, Care/of). Its differentiator is *transparent formulation*: every product page shows the full supply chain, third-party test results, and a plain-language explainer of why each ingredient is included at its specific dose.

Target audience: health-curious adults 30-55 who have outgrown drugstore vitamins but distrust influencer-endorsed "wellness" products. They read labels, compare studies, and value substance over aesthetics — though they appreciate clean design.`,
    constraints: `**Regulatory**
- All product claims must comply with FDA dietary supplement guidelines (structure/function claims only, no disease claims).
- Every ad must include the standard FDA disclaimer where applicable.
- FTC endorsement guidelines must be followed for any influencer or testimonial content — clear and conspicuous disclosure required.

**Brand**
- Never use before/after imagery for supplements.
- Do not reference prescription medications or suggest replacing medical advice.
- The word "cure" is banned in all contexts.

**Budget & Media**
- Q1 2026 paid media budget: $185K (60% digital, 25% podcast, 15% print).
- No TikTok presence until the brand-safety audit is complete (expected March 2026).
- Influencer partnerships require a minimum 6-month commitment; no one-off sponsored posts.`,
    decisions: [
      {
        title: 'Adopt transparent supply-chain labeling',
        date: '2025-06-12',
        content:
          'All product pages will include an interactive supply-chain map showing origin country, extraction method, and third-party testing lab for each ingredient. Design to begin Q3 2025, launch Q4 2025.',
        provenance: 'Brand strategy offsite — June 2025',
      },
      {
        title: 'Pause TikTok launch pending brand-safety audit',
        date: '2025-09-03',
        content:
          'After reviewing content moderation concerns, the team agreed to delay the TikTok channel launch until an independent brand-safety audit is completed. Estimated completion: March 2026.',
        provenance: 'Executive review call — 2025-09-03',
      },
      {
        title: 'Require 6-month minimum influencer commitments',
        date: '2025-10-18',
        content:
          'One-off sponsored posts underperformed by 70% vs. long-term partnerships. Moving forward, all influencer agreements require a minimum 6-month term with at least 4 deliverables.',
        provenance: 'Influencer performance review — Q3 2025 retrospective',
      },
      {
        title: 'Shift podcast budget to narrative-format shows',
        date: '2025-12-05',
        content:
          'Host-read ads on narrative health podcasts (e.g. Maintenance Phase, The Dream) drove 3.2x higher conversion than interview-format shows. Reallocating 80% of podcast budget to narrative formats in Q1 2026.',
        provenance: 'Media mix analysis — December 2025',
      },
      {
        title: 'Launch "Ingredient Spotlight" editorial series',
        date: '2026-01-20',
        content:
          'Monthly long-form articles (1,500-2,000 words) deep-diving into a single ingredient: sourcing, clinical evidence, and formulation rationale. First installment: Magnesium L-Threonate (February 2026).',
        provenance: 'Content calendar planning — January 2026',
      },
    ],
    meetings: [
      {
        title: 'Q1 2026 Kick-off — Acme Wellness',
        date: '2026-01-08',
        summary:
          'Reviewed Q4 2025 performance: site traffic up 22%, email list grew 18%, but conversion rate dipped 0.4%. The client wants to double down on educational content to rebuild trust after a competitor\'s contamination scandal shook the category. Priorities for Q1: launch Ingredient Spotlight series, finalize podcast reallocation, begin creative development for spring product launch (adaptogen blend). Client emphasized that the spring campaign should feel "calm confidence, not hype."',
      },
      {
        title: 'Creative Review — Spring Campaign Concepts',
        date: '2026-02-12',
        summary:
          'Presented three campaign directions for the adaptogen blend launch: (A) "Your Body Already Knows" — intuition-led, (B) "The Evidence Is In" — science-forward, (C) "Quiet Strength" — lifestyle vignettes. Client selected direction C with elements of B — they want real people in calm settings but with data callouts woven into the visuals. Photography should feel editorial, not stock. Next step: mood boards and copy deck by Feb 28.',
      },
      {
        title: 'Monthly Check-in — February 2026',
        date: '2026-02-26',
        summary:
          'Ingredient Spotlight (Magnesium L-Threonate) published — 4,200 pageviews in first week, 6.2% email click-through (above 4.8% benchmark). Client approved the "Quiet Strength" mood board with minor color adjustments (warmer earth tones, less gray). Discussed upcoming FDA guidance on NAC classification — legal team reviewing implications for two existing SKUs. Action item: prepare contingency messaging if NAC products need to be pulled.',
      },
    ],
  },

  'Lumina Aesthetics': {
    name: 'Lumina Aesthetics',
    brandVoice: `Lumina Aesthetics communicates with polished confidence. The tone is aspirational yet grounded — luxury medical aesthetics, not beauty counter hype. Think of a skilled surgeon who also has impeccable taste: precise, reassuring, and never condescending.

Clinical accuracy is non-negotiable. Use correct procedure names (e.g. "hyaluronic acid dermal filler" not "lip filler"), reference expected outcomes with appropriate hedging ("most patients see…"), and always acknowledge that results vary.

The brand addresses the reader as a capable adult making an informed investment in themselves. Avoid diminutives ("a little Botox"), guilt-based framing ("turn back the clock"), or language that implies the reader is flawed. The frame is enhancement, not correction.

Visuals and copy work together: where the imagery is soft and luminous, the copy provides the clinical backbone. Neither element should carry the entire persuasive load alone.`,
    positioning: `Lumina Aesthetics positions itself as the *medically credible* choice in a market crowded with med-spas of varying quality. The brand promise: board-certified practitioners, hospital-grade facilities, and treatment plans designed around long-term facial aesthetics rather than trend-chasing.

The competitive set includes Ideal Image (national chain, price-driven), SkinSpirit (premium but lifestyle-focused), and independent dermatology practices. Lumina differentiates through its "Aesthetic Blueprint" — a proprietary consultation framework that maps a multi-year treatment plan to the patient's facial anatomy and aging trajectory.

Target audience: professionals 35-60 with household income $150K+ who want visible results but fear looking "overdone." They research extensively, ask their dermatologist friends, and value credentials over Instagram followers.`,
    constraints: `**Regulatory**
- All advertising must comply with state medical board advertising rules for each clinic location (currently: CA, TX, FL, NY).
- Before/after photos require signed patient consent and must show unretouched images with standardized lighting.
- Claims about specific outcomes (e.g. "eliminates wrinkles") are prohibited; use hedged language ("designed to reduce the appearance of…").

**Brand**
- Never use the word "cheap," "discount," or "bargain" — even in competitive context.
- No celebrity endorsements. Patient testimonials only, with full disclosure.
- Photography must feature real patients (with consent) or professional models who reflect the actual patient demographic — no stock photos of 22-year-olds.

**Operational**
- Each clinic location has its own Google Business Profile and must be treated as a separate entity for local SEO.
- The Houston location is underperforming; 30% of Q1 paid media budget is ring-fenced for Houston market activation.
- New patient consultations are the primary conversion goal — not product sales.`,
    decisions: [
      {
        title: 'Launch "Aesthetic Blueprint" as lead differentiator',
        date: '2025-07-22',
        content:
          'The proprietary consultation framework — mapping a multi-year treatment plan to facial anatomy — will become the centerpiece of all brand messaging. Every landing page, ad, and intake flow should reference the Blueprint. Creative assets needed by September 2025.',
        provenance: 'Brand positioning workshop — July 2025',
      },
      {
        title: 'Ring-fence 30% of paid media for Houston',
        date: '2025-11-14',
        content:
          'Houston clinic is 40% below new-patient targets. Allocating 30% of Q1 2026 paid budget ($72K) to Houston-specific campaigns: local search, targeted social, and a "Grand Re-Introduction" event in February.',
        provenance: 'Quarterly business review — November 2025',
      },
      {
        title: 'Prohibit stock photography of younger demographics',
        date: '2025-11-14',
        content:
          'Patient feedback indicated that seeing models in their early 20s felt inauthentic and alienating. All photography will feature real patients (with consent) or models aged 35+ who reflect the core demographic.',
        provenance: 'Patient experience survey analysis — November 2025',
      },
      {
        title: 'Adopt location-specific landing pages for paid search',
        date: '2026-01-09',
        content:
          'Generic landing pages converted at 2.1%; location-specific pages with local practitioner bios, clinic photos, and city-specific copy converted at 4.7%. Rolling out location-specific pages for all four markets by end of January.',
        provenance: 'Paid search performance audit — January 2026',
      },
    ],
    meetings: [
      {
        title: 'Houston Market Activation Planning',
        date: '2026-01-15',
        summary:
          'Brainstormed the "Grand Re-Introduction" event concept for the Houston clinic. Format: invitation-only evening for 80 high-value prospects (sourced from dermatologist referrals and existing patient network). Event includes mini-consultations, live procedure demo (non-invasive), and a Q&A panel with the medical director. Budget: $18K. Client wants the invitation to feel exclusive — heavy card stock, hand-addressed. Digital follow-up sequence for attendees who don\'t book within 7 days.',
      },
      {
        title: 'Q1 2026 Creative Briefing',
        date: '2026-01-22',
        summary:
          'Briefed the creative team on Q1 priorities: (1) Houston activation collateral, (2) updated Aesthetic Blueprint explainer video (current version is 14 months old), (3) spring refresh for the website hero — client wants to feature a real patient story. The medical director stressed that the explainer video must show the consultation process, not just results. Budget approved for a one-day video shoot at the Manhattan clinic in February.',
      },
      {
        title: 'Monthly Performance Review — January 2026',
        date: '2026-02-05',
        summary:
          'January results: 312 new patient consultations across all locations (target: 340). Houston accounted for only 48 (target: 85). Manhattan and LA both exceeded targets. Location-specific landing pages already showing improvement — Houston page CPC dropped 18% and CTR increased 1.2 points. Client approved the patient story concept for the website hero; patient "Sarah M." has signed consent and is available for a photo session. Next meeting: post-event debrief after Houston activation (Feb 22).',
      },
    ],
  },

  'Peak Performance': {
    name: 'Peak Performance',
    brandVoice: `Peak Performance is direct, energetic, and technically fluent. The brand sounds like a knowledgeable training partner — someone who has done the research *and* the reps. Sentences are short. Paragraphs are punchy. The reader should feel a bias toward action.

Technical credibility matters: use proper terminology (VO2 max, rate of force development, glycogen resynthesis) but always follow with a plain-language translation for the broader audience. The brand straddles two audiences — competitive athletes and ambitious amateurs — and the copy must serve both without talking down to either.

Exclamation marks are earned, not sprinkled. Use them for genuine moments of excitement (a product launch, a record-breaking result) rather than as a substitute for weak copy. "Get 10% off!" is lazy. "The new V3 formula is here — and the beta testers couldn't shut up about it." is on-brand.

Humor is welcome — locker-room wit, self-deprecating nods to the pain of training — but never at the expense of the product's credibility. The brand takes performance seriously even when it doesn't take itself seriously.`,
    positioning: `Peak Performance sits at the intersection of sports nutrition and fitness technology. The product line includes performance supplements (pre-workout, recovery, protein), a wearable recovery tracker (PeakBand), and a training app (PeakPlan) that integrates nutrition, training load, and recovery data.

The competitive landscape includes Momentous (premium supplements, pro-athlete endorsements), WHOOP (wearable + subscription), and Onnit (supplements + lifestyle). Peak Performance differentiates through *integration*: the supplement, the wearable, and the app form a closed loop where each informs the other. "Your recovery data personalizes your nutrition" is the core value proposition.

Target audience: dedicated recreational athletes 25-45 (CrossFit, endurance sports, hybrid training) who track their training and are willing to pay a premium for products that optimize their performance stack.`,
    constraints: `**Regulatory**
- Supplement claims must comply with FDA DSHEA guidelines — structure/function claims only.
- The PeakBand is classified as a general wellness device (not a medical device). Marketing must not imply it diagnoses or treats any condition.
- FTC guidelines for endorsements apply to all athlete partnerships and user testimonials.

**Brand**
- No negative comparisons to competitors by name in advertising.
- Athlete sponsorships must include at least one non-professional athlete ("real performer") for every two professional athletes featured.
- The brand does not participate in "Black Friday" or deep-discount promotions — maximum allowed discount is 15% and only for bundle offers.

**Technical**
- PeakBand firmware updates and app releases must be announced 72 hours in advance via email to existing users before any public marketing.
- Nutrition claims must reference specific clinical studies; vague phrases like "scientifically proven" are insufficient.
- All landing pages must load in under 2.5 seconds (Core Web Vitals target).`,
    decisions: [
      {
        title: 'Position the ecosystem integration as primary differentiator',
        date: '2025-08-09',
        content:
          'All campaigns will lead with the integration story: supplement + wearable + app as a unified performance system. Individual product marketing is secondary to the ecosystem narrative. Tagline candidate: "Everything talks to everything."',
        provenance: 'Brand strategy session — August 2025',
      },
      {
        title: 'Include "real performer" in all athlete campaigns',
        date: '2025-09-28',
        content:
          'For every two professional athletes featured in a campaign, at least one dedicated recreational athlete ("real performer") must be included. This ensures the brand remains accessible to the core audience while leveraging pro credibility.',
        provenance: 'Audience research debrief — September 2025',
      },
      {
        title: 'Cap discounts at 15%, bundles only',
        date: '2025-10-30',
        content:
          'Deep discounting eroded brand perception in Q3 testing. Maximum discount is now 15%, available only on bundle offers (e.g. supplement + PeakBand). No standalone product discounts. No Black Friday participation.',
        provenance: 'Pricing strategy review — October 2025',
      },
      {
        title: 'Require 72-hour advance notice for firmware/app updates',
        date: '2025-11-20',
        content:
          'Users were frustrated by surprise updates that changed PeakBand behavior. All firmware and app releases now require a 72-hour email heads-up to existing users before public marketing. Template approved; product team owns the send.',
        provenance: 'Customer satisfaction task force — November 2025',
      },
      {
        title: 'Launch "Performance Stack" content hub',
        date: '2026-01-14',
        content:
          'A dedicated content section on the website featuring training protocols, nutrition guides, and recovery science — all tied back to the Peak Performance ecosystem. Goal: establish authority and drive organic traffic. First 10 articles planned for Q1 2026.',
        provenance: 'Content strategy workshop — January 2026',
      },
    ],
    meetings: [
      {
        title: 'Q1 2026 Planning — Peak Performance',
        date: '2026-01-10',
        summary:
          'Reviewed the 2025 wrap-up: revenue grew 34%, PeakBand adoption exceeded projections by 15%, but app engagement plateaued in Q4. The client wants Q1 to focus on re-engaging existing users (push the ecosystem loop) while acquiring new users through the Performance Stack content hub. Key initiative: a 6-week "Performance Stack Challenge" where users follow a prescribed supplement + training + recovery protocol through the app, tracked by PeakBand. Launch target: March 2026.',
      },
      {
        title: 'Performance Stack Challenge — Creative Kickoff',
        date: '2026-02-03',
        summary:
          'Aligned on the challenge structure: 6 weeks, 3 difficulty tiers (Foundation, Competitive, Elite), with weekly check-ins via the app. Marketing plan includes a launch video featuring two pro athletes and one real performer, email nurture sequence for signups, and a leaderboard mechanic. The client wants the tone to be "serious about results, not serious about itself." Copy direction: confident, slightly irreverent, data-rich. Video shoot scheduled for Feb 20 at the training facility in Austin.',
      },
      {
        title: 'Monthly Check-in — February 2026',
        date: '2026-02-24',
        summary:
          'Performance Stack content hub soft-launched with 4 articles — early traffic looks promising (8,200 sessions, 3.1 min avg. session duration). Video shoot for the Challenge went well; rough cuts expected March 3. PeakBand firmware v2.4 releasing March 5 — 72-hour notice email draft reviewed and approved. Client flagged a competitor (Momentous) launching a wearable integration with Oura; wants a competitive response brief by March 10.',
      },
    ],
  },
}

// ---- Agency Context -------------------------------------------------------

export const AGENCY_CONTEXT = `# Near&Dear — Agency Context

## Voice & Tone

Near&Dear is a boutique agency specializing in the human-vitality vertical: wellness, aesthetics, sports nutrition, and longevity. Our own brand voice is distinct from any client's.

**Tone**: Thoughtful, precise, and genuinely curious. We sound like senior strategists who read widely and think carefully — not like an agency that just discovered a new buzzword. Internal docs and client communications should feel like a well-edited email, not a pitch deck.

**Principles**:
- Clarity over cleverness. If a simpler word works, use it.
- Show the thinking. Clients hire us for our judgment, so our communications should make the reasoning visible.
- Respect the reader's time. Every document should earn the length it takes.

## Process Playbooks

### Client Onboarding (Week 1-4)
1. **Discovery session** (2 hours): Map brand history, competitive landscape, and stakeholder priorities.
2. **Memory seeding**: Populate MemoryKit with initial brand voice, positioning, constraints, and key decisions from discovery materials.
3. **Audit**: Review existing content, analytics, and martech stack.
4. **Strategy brief**: Deliver a 90-day strategy with clear OKRs, creative territories, and media recommendations.

### Campaign Development
1. **Brief**: Single-page brief with objective, audience, key message, mandatory inclusions, and success metrics.
2. **Concept round**: 3 creative directions presented as written territories (no design yet).
3. **Client selection**: Client picks one direction; team develops into full creative (copy + design + media plan).
4. **Review cycle**: Maximum 2 rounds of revisions before final approval.
5. **Launch & learn**: Post-launch, run a 2-week performance check; extract learnings into MemoryKit.

### Monthly Rhythm
- **Week 1**: Performance review of prior month; update MemoryKit with new decisions/learnings.
- **Week 2**: Creative development for upcoming month.
- **Week 3**: Client review & approvals.
- **Week 4**: Production, QA, scheduling.

## Team Structure

| Role | Name | Focus |
|------|------|-------|
| Founder & Strategy Lead | Dana Marchetti | Overall strategy, client relationships |
| Creative Director | Tomás Herrera | Copy, brand voice, campaign concepts |
| Head of Media | Priya Nair | Paid media, analytics, attribution |
| Account Manager | Jordan Liu | Day-to-day client comms, project management |
| Senior Designer | Anika Patel | Visual identity, campaign design |
| Content Strategist | Marcus Webb | Editorial calendar, SEO, content production |

## Cross-Client Standards

- **Naming conventions**: All files follow \`[client-slug]/[type]/[YYYY-MM-DD]-[descriptor]\`. E.g., \`acme-wellness/briefs/2026-01-15-spring-campaign-brief.md\`.
- **Approval workflow**: Any memory entry submitted by an AI assistant must be reviewed by a human team member before becoming permanent.
- **Reporting cadence**: Monthly performance decks delivered by the 5th of the following month.
- **Tool stack**: Figma (design), Linear (project management), Notion (internal wiki), MemoryKit (organizational memory).
`

// ---- Industry Context -----------------------------------------------------

export const INDUSTRY_CONTEXT = `# Human Vitality Industry — Shared Knowledge

## Regulatory Landscape

### FDA — Dietary Supplements
- Supplements are regulated under DSHEA (1994). Manufacturers are responsible for safety; the FDA does not pre-approve supplements.
- **Structure/function claims** are permitted (e.g., "supports immune health") but must include the disclaimer: *"This statement has not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease."*
- **Disease claims** are prohibited without an approved NDA/health claim petition.
- **NAC (N-Acetyl Cysteine)**: FDA enforcement discretion is evolving. As of early 2026, NAC is available as a supplement but brands should monitor FDA guidance closely. Any SKU containing NAC should have contingency messaging prepared.
- **cGMP compliance** is mandatory for all supplement manufacturing facilities.

### FDA — Medical Devices (Wellness Wearables)
- General wellness devices (fitness trackers, recovery monitors) are exempt from most FDA medical device regulations *as long as* marketing does not claim to diagnose, treat, or prevent disease.
- Claims like "tracks your recovery" are acceptable. Claims like "detects atrial fibrillation" require 510(k) clearance.

### FTC — Advertising & Endorsements
- The FTC requires that endorsements reflect **honest opinions** and that **material connections** (payment, free products) are clearly disclosed.
- The updated Endorsement Guides (2023) explicitly cover social media influencers, affiliate marketers, and AI-generated reviews.
- **Substantiation doctrine**: objective claims must be backed by competent and reliable evidence (typically at least one well-designed clinical study).

## Market Trends (2025-2026)

### Wellness & Supplements
- The global dietary supplement market is projected at ~$230B by 2027 (Euromonitor).
- **Transparency** is the dominant trend: consumers increasingly demand third-party testing certifications, full ingredient sourcing disclosure, and clean-label formulations.
- **Personalization** is growing but still niche: brands offering DNA- or biomarker-based supplement recommendations are gaining traction with early adopters.
- **Adaptogens** (ashwagandha, rhodiola, lion's mane) continue their mainstream crossover, appearing in beverages, snacks, and dedicated supplement lines.

### Medical Aesthetics
- The U.S. medical aesthetics market reached ~$18B in 2025, driven by non-invasive procedures (neurotoxins, dermal fillers, body contouring).
- **Younger entry points**: patients in their late 20s and early 30s are seeking preventive treatments ("pre-juvenation"), expanding the addressable market.
- **Credential sensitivity**: high-profile complications from unlicensed providers are driving consumers toward board-certified practitioners. Credentialing is a meaningful differentiator.
- **Technology convergence**: AI-powered skin analysis tools and 3D facial mapping are becoming standard in premium clinics, enabling more personalized treatment plans.

### Sports Nutrition & Fitness Tech
- The performance nutrition market is shifting from single-product purchases to **ecosystem plays**: brands that connect nutrition, wearables, and training software capture higher LTV.
- **Recovery** has overtaken pure performance as the dominant consumer interest — sleep optimization, HRV tracking, and active recovery protocols are driving product development.
- **Community-driven challenges** (e.g., 30-day protocols, leaderboards) are proving more effective than traditional advertising for user acquisition and retention.
- Competitive landscape is consolidating: expect more acquisitions as larger brands (e.g., Gatorade/PepsiCo, Abbott) move into the premium performance segment.

## Audience Insights

- **Trust deficit**: consumers in all three sub-verticals express declining trust in brand claims. Third-party validation (certifications, practitioner endorsements, peer reviews) outperforms brand-authored content.
- **Content as evaluation tool**: prospects consume 5-8 pieces of content before making a purchase or booking a consultation. Long-form educational content (articles, videos, podcasts) disproportionately influences high-value customers.
- **Privacy awareness**: health and wellness audiences are increasingly cautious about sharing personal data. Transparent data practices and clear opt-in mechanisms are table stakes for wearable and app-based products.
`

// ---- Search Results -------------------------------------------------------

export const SEARCH_RESULTS: SearchResult[] = [
  {
    path: 'acme-wellness/decisions/2025-06-12-supply-chain-labeling.md',
    title: 'Adopt transparent supply-chain labeling',
    client: 'Acme Wellness',
    type: 'decision',
    created: '2025-06-12',
    provenance: 'Brand strategy offsite — June 2025',
    excerpt:
      'All product pages will include an interactive supply-chain map showing origin country, extraction method, and third-party testing lab for each ingredient.',
    rank: 1,
  },
  {
    path: 'acme-wellness/decisions/2025-12-05-podcast-budget-reallocation.md',
    title: 'Shift podcast budget to narrative-format shows',
    client: 'Acme Wellness',
    type: 'decision',
    created: '2025-12-05',
    provenance: 'Media mix analysis — December 2025',
    excerpt:
      'Host-read ads on narrative health podcasts drove 3.2x higher conversion than interview-format shows. Reallocating 80% of podcast budget to narrative formats.',
    rank: 2,
  },
  {
    path: 'acme-wellness/meetings/2026-02-12-creative-review.md',
    title: 'Creative Review — Spring Campaign Concepts',
    client: 'Acme Wellness',
    type: 'meeting',
    created: '2026-02-12',
    provenance: 'Meeting notes — 2026-02-12',
    excerpt:
      'Client selected direction C ("Quiet Strength") with elements of B — real people in calm settings but with data callouts woven into the visuals. Photography should feel editorial, not stock.',
    rank: 3,
  },
  {
    path: 'acme-wellness/briefs/2026-01-20-ingredient-spotlight-series.md',
    title: 'Ingredient Spotlight editorial series brief',
    client: 'Acme Wellness',
    type: 'brief',
    created: '2026-01-20',
    provenance: 'Content calendar planning — January 2026',
    excerpt:
      'Monthly long-form articles deep-diving into a single ingredient: sourcing, clinical evidence, and formulation rationale. First installment: Magnesium L-Threonate.',
    rank: 4,
  },
  {
    path: 'acme-wellness/constraints/2025-09-03-tiktok-pause.md',
    title: 'TikTok launch paused pending brand-safety audit',
    client: 'Acme Wellness',
    type: 'constraint',
    created: '2025-09-03',
    provenance: 'Executive review call — 2025-09-03',
    excerpt:
      'Content moderation concerns led to a delay of the TikTok channel launch. Independent brand-safety audit expected complete by March 2026.',
    rank: 5,
  },
  {
    path: 'lumina-aesthetics/decisions/2025-07-22-aesthetic-blueprint.md',
    title: 'Launch "Aesthetic Blueprint" as lead differentiator',
    client: 'Lumina Aesthetics',
    type: 'decision',
    created: '2025-07-22',
    provenance: 'Brand positioning workshop — July 2025',
    excerpt:
      'The proprietary consultation framework — mapping a multi-year treatment plan to facial anatomy — will become the centerpiece of all brand messaging.',
    rank: 6,
  },
  {
    path: 'lumina-aesthetics/decisions/2026-01-09-location-landing-pages.md',
    title: 'Adopt location-specific landing pages for paid search',
    client: 'Lumina Aesthetics',
    type: 'decision',
    created: '2026-01-09',
    provenance: 'Paid search performance audit — January 2026',
    excerpt:
      'Location-specific pages with local practitioner bios, clinic photos, and city-specific copy converted at 4.7% vs. 2.1% for generic pages.',
    rank: 7,
  },
  {
    path: 'lumina-aesthetics/meetings/2026-01-15-houston-activation.md',
    title: 'Houston Market Activation Planning',
    client: 'Lumina Aesthetics',
    type: 'meeting',
    created: '2026-01-15',
    provenance: 'Meeting notes — 2026-01-15',
    excerpt:
      'Invitation-only evening event for 80 high-value prospects. Mini-consultations, live procedure demo, and Q&A panel with the medical director. Budget: $18K.',
    rank: 8,
  },
  {
    path: 'lumina-aesthetics/constraints/2025-11-14-no-stock-photography.md',
    title: 'Prohibit stock photography of younger demographics',
    client: 'Lumina Aesthetics',
    type: 'constraint',
    created: '2025-11-14',
    provenance: 'Patient experience survey analysis — November 2025',
    excerpt:
      'Patient feedback indicated that seeing models in their early 20s felt inauthentic. All photography will feature real patients or models aged 35+ reflecting the core demographic.',
    rank: 9,
  },
  {
    path: 'lumina-aesthetics/preferences/2025-11-14-no-discount-language.md',
    title: 'Avoid discount-oriented language',
    client: 'Lumina Aesthetics',
    type: 'preference',
    created: '2025-11-14',
    provenance: 'Brand positioning workshop — July 2025',
    excerpt:
      'Never use "cheap," "discount," or "bargain" — even in competitive context. Positioning is premium medical aesthetics, and pricing language must reflect that.',
    rank: 10,
  },
  {
    path: 'peak-performance/decisions/2025-08-09-ecosystem-positioning.md',
    title: 'Position ecosystem integration as primary differentiator',
    client: 'Peak Performance',
    type: 'decision',
    created: '2025-08-09',
    provenance: 'Brand strategy session — August 2025',
    excerpt:
      'All campaigns will lead with the integration story: supplement + wearable + app as a unified performance system. Tagline candidate: "Everything talks to everything."',
    rank: 11,
  },
  {
    path: 'peak-performance/decisions/2025-10-30-discount-cap.md',
    title: 'Cap discounts at 15%, bundles only',
    client: 'Peak Performance',
    type: 'decision',
    created: '2025-10-30',
    provenance: 'Pricing strategy review — October 2025',
    excerpt:
      'Maximum discount is 15%, available only on bundle offers. No standalone product discounts. No Black Friday participation. Deep discounting eroded brand perception.',
    rank: 12,
  },
  {
    path: 'peak-performance/meetings/2026-02-03-challenge-creative-kickoff.md',
    title: 'Performance Stack Challenge — Creative Kickoff',
    client: 'Peak Performance',
    type: 'meeting',
    created: '2026-02-03',
    provenance: 'Meeting notes — 2026-02-03',
    excerpt:
      '6-week challenge with 3 difficulty tiers (Foundation, Competitive, Elite). Launch video featuring two pro athletes and one real performer. Tone: "serious about results, not serious about itself."',
    rank: 13,
  },
  {
    path: 'peak-performance/briefs/2026-01-14-performance-stack-hub.md',
    title: 'Performance Stack content hub launch brief',
    client: 'Peak Performance',
    type: 'brief',
    created: '2026-01-14',
    provenance: 'Content strategy workshop — January 2026',
    excerpt:
      'Dedicated content section featuring training protocols, nutrition guides, and recovery science — all tied back to the Peak Performance ecosystem. First 10 articles planned for Q1 2026.',
    rank: 14,
  },
  {
    path: 'peak-performance/constraints/2025-11-20-firmware-notice.md',
    title: '72-hour advance notice for firmware/app updates',
    client: 'Peak Performance',
    type: 'constraint',
    created: '2025-11-20',
    provenance: 'Customer satisfaction task force — November 2025',
    excerpt:
      'All PeakBand firmware and app releases require a 72-hour email heads-up to existing users before any public marketing. Template approved; product team owns the send.',
    rank: 15,
  },
  {
    path: 'peak-performance/facts/2026-02-24-competitor-oura-integration.md',
    title: 'Momentous launching Oura wearable integration',
    client: 'Peak Performance',
    type: 'fact',
    created: '2026-02-24',
    provenance: 'Monthly check-in — February 2026',
    excerpt:
      'Competitor Momentous is launching a wearable integration with Oura. Client wants a competitive response brief by March 10, 2026.',
    rank: 16,
  },
  {
    path: 'acme-wellness/facts/2026-02-26-nac-fda-review.md',
    title: 'FDA guidance on NAC classification under review',
    client: 'Acme Wellness',
    type: 'fact',
    created: '2026-02-26',
    provenance: 'Monthly check-in — February 2026',
    excerpt:
      'Upcoming FDA guidance on NAC classification may affect two existing Acme Wellness SKUs. Legal team reviewing implications. Action item: prepare contingency messaging.',
    rank: 17,
  },
  {
    path: 'acme-wellness/preferences/2026-02-12-spring-photography-style.md',
    title: 'Spring campaign photography: editorial, warm earth tones',
    client: 'Acme Wellness',
    type: 'preference',
    created: '2026-02-12',
    provenance: 'Creative review — February 2026',
    excerpt:
      'Client approved "Quiet Strength" mood board with minor adjustments: warmer earth tones, less gray. Photography should feel editorial, not stock. Real people in calm settings.',
    rank: 18,
  },
  {
    path: 'lumina-aesthetics/facts/2026-02-05-houston-performance.md',
    title: 'Houston clinic underperforming — 48 vs. 85 target consultations',
    client: 'Lumina Aesthetics',
    type: 'fact',
    created: '2026-02-05',
    provenance: 'Monthly performance review — January 2026',
    excerpt:
      'Houston location delivered only 48 new patient consultations against an 85-unit target. Location-specific landing pages showing early improvement: CPC dropped 18%, CTR increased 1.2 points.',
    rank: 19,
  },
  {
    path: 'peak-performance/facts/2026-02-24-content-hub-soft-launch.md',
    title: 'Performance Stack content hub soft-launch results',
    client: 'Peak Performance',
    type: 'fact',
    created: '2026-02-24',
    provenance: 'Monthly check-in — February 2026',
    excerpt:
      'Soft-launched with 4 articles — 8,200 sessions in the first reporting period, 3.1 min average session duration. Promising early engagement for organic content.',
    rank: 20,
  },
]

// ---- Pending Memories (Approval Queue) ------------------------------------

export const PENDING_MEMORIES: MemoryEntry[] = [
  {
    id: 'mem_01H8X9K2M3',
    title: 'Spring campaign tagline direction: "Quiet Strength"',
    client: 'Acme Wellness',
    type: 'decision',
    status: 'pending',
    submitted: '2026-02-12',
    provenance: 'Creative review call — 2026-02-12',
    confidence: 'high',
    content:
      'The client selected campaign direction C ("Quiet Strength") for the spring adaptogen blend launch. The creative approach combines lifestyle vignettes of real people in calm settings with science-backed data callouts woven into the visuals. Photography direction: editorial, warm earth tones, no stock imagery.',
  },
  {
    id: 'mem_01H8X9K2M4',
    title: 'Patient "Sarah M." approved for website hero feature',
    client: 'Lumina Aesthetics',
    type: 'fact',
    status: 'pending',
    submitted: '2026-02-05',
    provenance: 'Monthly performance review — January 2026',
    confidence: 'high',
    content:
      'Patient Sarah M. has signed consent to be featured in the website hero section as part of a real patient story. She is available for a photo session. This supports the decision to prohibit stock photography and feature real patients.',
  },
  {
    id: 'mem_01H8X9K2M5',
    title: 'Momentous launching Oura wearable integration',
    client: 'Peak Performance',
    type: 'competitive-intel',
    status: 'approved',
    submitted: '2026-02-24',
    provenance: 'Monthly check-in — February 2026',
    confidence: 'high',
    content:
      'Competitor Momentous is launching a wearable integration partnership with Oura. This directly challenges Peak Performance\'s ecosystem differentiation strategy. Client has requested a competitive response brief by March 10, 2026.',
  },
  {
    id: 'mem_01H8X9K2M6',
    title: 'Houston event format: invitation-only, 80 guests',
    client: 'Lumina Aesthetics',
    type: 'decision',
    status: 'approved',
    submitted: '2026-01-15',
    provenance: 'Houston activation planning — 2026-01-15',
    confidence: 'high',
    content:
      'The Houston "Grand Re-Introduction" event will be invitation-only for 80 high-value prospects sourced from dermatologist referrals and the existing patient network. Includes mini-consultations, a live non-invasive procedure demo, and a Q&A with the medical director. Budget: $18K. Invitations should feel exclusive — heavy card stock, hand-addressed.',
  },
  {
    id: 'mem_01H8X9K2M7',
    title: 'NAC products may need contingency messaging',
    client: 'Acme Wellness',
    type: 'constraint',
    status: 'rejected',
    submitted: '2026-02-26',
    provenance: 'Monthly check-in — February 2026',
    confidence: 'medium',
    content:
      'FDA is reviewing guidance on NAC (N-Acetyl Cysteine) classification that could affect two existing Acme Wellness SKUs. Legal team is reviewing implications. The team should prepare contingency messaging in case products need to be reformulated or temporarily pulled. Rejected: moved to a dedicated regulatory tracking document instead of memory.',
  },
]
