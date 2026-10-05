// Source of truth for the OpsRamp on-prem architecture reel.
// Narration (vo) is verbatim from SCREENPLAY.md. Diagram coordinates are in
// stage pixels: the stage is 1744 x 632 and sits under the scene title.
// A cue is a phrase from the scene's own narration; the item appears when the
// narrator says it. A null cue means the item is on screen from the first frame.

export const FILM = {
  id: 'opsramp-onprem-architecture-journey',
  title: 'OpsRamp on-prem: the architecture journey',
  subtitle: 'Same product, same contract, our own operations',
  voice: 'en-US-AndrewMultilingualNeural',
  rate: '+2%',
  fps: 30,
  width: 1920,
  height: 1080,
  transitionSeconds: 0.44,
  minimumDurationSeconds: 600,
  minimumSceneSeconds: 8,
  sourceStatus: 'Product owner account, 2026-09-22 and 2026-09-23 · internal council briefing',
  message: 'We reuse the platform, and we reuse our own operations.',
  audience: 'HPE Chief Technologist council',
  arc: 'Question → SaaS on GreenLake → Managed on-prem → Darksite → SilverCreek → OpsRamp runs OpsRamp → Reuse ledger',
  chaptersComment: 'OpsRamp on-prem architecture journey. Internal council briefing. Neural narration.'
}

const node = (id, x, y, w, h, label, options = {}) => ({ type: 'node', id, x, y, w, h, label, ...options })
const zone = (id, x, y, w, h, label, options = {}) => ({ type: 'zone', id, x, y, w, h, label, ...options })
const text = (id, x, y, w, h, label, options = {}) => ({ type: 'text', id, x, y, w, h, label, ...options })
const edge = (id, points, options = {}) => ({ type: 'edge', id, points, ...options })
const row = (id, y, label, source, badge, cue) => ({ type: 'row', id, x: 0, y, w: 1744, h: 58, label, source, badge, cue })
const beat = (cue, act, targets, options = {}) => ({ cue, act, targets: [targets].flat(), ...options })

const SOCKETS = ['AuthN', 'Tenancy', 'Subscription', 'User mgmt', 'Notifications']
const OPS_PRACTICE = ['Runbooks', 'Remediation', 'Incident recovery', 'Monitoring practice']

const PART1 = 'PART 1 · SAAS OPSRAMP BECOMES A GREENLAKE SERVICE'
const PART2 = 'PART 2 · FROM HPE-MANAGED TO CUSTOMER-MANAGED'
const PART3 = 'PART 3 · OPSRAMP RUNS OPSRAMP'

export const SCENES = [
  {
    id: '01-question',
    chapter: 'The question',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'OPSRAMP ON-PREM · ARCHITECTURE JOURNEY',
    title: 'Are we building a second platform?',
    support: 'For the HPE Chief Technologist council.',
    status: 'OPENING',
    vo: `Some of you have asked whether on-prem OpsRamp means building a second platform. It does not. On-prem OpsRamp is the same product as our SaaS. It reuses the GreenLake platform contract, the Morpheus integration we already ship, and ten years of our own operations practice. Here is the journey that brought us here, and the proof.`,
    diagram: {
      items: [
        text('no', 0, 0, 1744, 200, 'No.', { size: 'xl', cue: 'It does not' }),
        text('same', 0, 214, 1744, 60, 'On-prem OpsRamp is the same product as our SaaS.', { size: 'md', cue: 'the same product as our SaaS' }),
        node('p1', 0, 320, 560, 170, 'GreenLake platform contract', { sub: 'The service onboarder contract', tone: 'green', cue: 'the GreenLake platform contract' }),
        node('p2', 592, 320, 560, 170, 'Morpheus integration', { sub: 'The plugin we already ship', tone: 'green', cue: 'the Morpheus integration' }),
        node('p3', 1184, 320, 560, 170, 'Ten years of operations', { sub: 'How OpsRamp runs OpsRamp today', tone: 'green', cue: 'ten years of our own' }),
        text('proof', 0, 540, 1744, 60, 'The journey, and the proof →', { size: 'md', tone: 'accent', cue: 'Here is the journey' })
      ],
      beats: [beat('and the proof', 'glow', ['p1', 'p2', 'p3'], { hold: 2.2 })]
    }
  },
  {
    id: '02-standalone',
    chapter: 'Where we started',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 1 · THREE YEARS AGO',
    title: 'A standalone, multi-tenant SaaS product.',
    support: 'Its own sign-in, its own tenancy, its own commercial path.',
    status: PART1,
    vo: `Three years ago, OpsRamp was a standalone, multi-tenant SaaS product. It had its own sign-in, its own tenancy, and its own commercial path. Customers reached it on its own, not through HPE GreenLake. For data residency, it ran as geographically separate clusters. A customer whose environments were onboarded to more than one cluster had more than one way in. OpsRamp could not give them a single front door on its own. Everything that follows is the story of turning that product into a GreenLake service, and then taking that same service on-premises.`,
    diagram: {
      items: [
        node('own1', 0, 90, 400, 96, 'Own sign-in', { tone: 'ghost', cue: 'its own sign-in' }),
        node('own2', 0, 215, 400, 96, 'Own tenancy', { tone: 'ghost', cue: 'its own tenancy' }),
        node('own3', 0, 340, 400, 96, 'Own commercial path', { tone: 'ghost', cue: 'its own commercial path' }),
        edge('e-own1', [[400, 138], [622, 220]], { arrow: false, cue: 'its own sign-in', delay: 0.3 }),
        edge('e-own2', [[400, 263], [622, 263]], { arrow: false, cue: 'its own tenancy', delay: 0.3 }),
        edge('e-own3', [[400, 388], [622, 306]], { arrow: false, cue: 'its own commercial path', delay: 0.3 }),
        node('opsramp', 622, 150, 500, 226, 'OpsRamp SaaS', {
          sub: 'Standalone · multi-tenant',
          tone: 'solid',
          cue: 'OpsRamp was a standalone',
          chips: [
            { text: 'Region A', cue: 'geographically separate clusters' },
            { text: 'Region B', cue: 'geographically separate clusters' },
            { text: 'Region C', cue: 'geographically separate clusters' }
          ]
        }),
        node('greenlake', 1344, 40, 400, 96, 'HPE GreenLake', { sub: 'Not the route in, yet', tone: 'ghost', cue: 'not through HPE GreenLake' }),
        node('customers', 1344, 215, 400, 96, 'Customers', { cue: 'Customers reached it' }),
        edge('e-cust', [[1344, 263], [1122, 263]], { label: 'direct', cue: 'Customers reached it', delay: 0.3 }),
        edge('e-cust2', [[1344, 295], [1122, 340]], { cue: 'more than one way in' }),
        node('nodoor', 1344, 360, 400, 110, 'No single front door', { sub: 'One way in per cluster', tone: 'amber', cue: 'could not give them a single front door' }),
        node('j1', 0, 510, 460, 90, 'SaaS product', { tone: 'green', compact: true, cue: 'Everything that follows' }),
        edge('e-j1', [[460, 555], [642, 555]], { cue: 'into a GreenLake service' }),
        node('j2', 642, 510, 460, 90, 'GreenLake service', { tone: 'green', compact: true, cue: 'into a GreenLake service', delay: 0.3 }),
        edge('e-j2', [[1102, 555], [1284, 555]], { cue: 'taking that same service' }),
        node('j3', 1284, 510, 460, 90, 'On-premises', { tone: 'green', compact: true, cue: 'taking that same service', delay: 0.3 })
      ],
      beats: []
    }
  },
  {
    id: '03-onboarding',
    chapter: 'Onboarding to GreenLake',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 1 · SERVICE ONBOARDER',
    title: 'OpsRamp becomes a GreenLake service onboarder.',
    support: 'Five API contracts define the relationship. Watch this band.',
    status: PART1,
    vo: `The first phase made OpsRamp a GreenLake service onboarder. Customers now enter through the GreenLake cloud front door. It is one door, whichever cluster their data lives on, something OpsRamp could not build alone. And OpsRamp relies on GreenLake for authentication. That relationship is defined by a set of API contracts: authentication, tenancy, subscription, user management, and notifications from the platform. Watch this band of five sockets. It is the most important object in this talk. Onboarding also meant reporting OpsRamp consumption data to GreenLake Consumption Data Services for invoicing, and integrating with the Global Trade Service. From this point on, OpsRamp does not own identity, subscriptions, or users. The platform owns them, and OpsRamp honors the contract. That discipline is what makes everything later in this story possible.`,
    diagram: {
      items: [
        node('greenlake', 0, 0, 1744, 120, 'HPE GreenLake cloud', { sub: 'Front door · authentication', tone: 'platform', cue: 'GreenLake cloud front door' }),
        node('cds', 1180, 28, 260, 64, 'CDS', { tone: 'green', compact: true, cue: 'Consumption Data Services' }),
        node('gts', 1466, 28, 260, 64, 'GTS', { tone: 'green', compact: true, cue: 'Global Trade Service' }),
        node('customers', 0, 400, 340, 110, 'Customers', { cue: 'Customers now enter' }),
        edge('e-cust', [[170, 400], [170, 120]], { label: 'sign in', labelAlign: 'left', labelAt: [184, 300], cue: 'Customers now enter', delay: 0.3 }),
        node('band', 222, 190, 1060, 110, 'Service onboarder contract', {
          type: 'band',
          cue: 'a set of API contracts',
          chips: [
            { text: 'AuthN', cue: 'contracts authentication' },
            { text: 'Tenancy', cue: 'authentication tenancy subscription' },
            { text: 'Subscription', cue: 'subscription user management' },
            { text: 'User mgmt', cue: 'user management and' },
            { text: 'Notifications', cue: 'notifications from the platform' }
          ]
        }),
        edge('e-gl-band', [[752, 120], [752, 190]], { cue: 'a set of API contracts', delay: 0.2 }),
        edge('e-band-or', [[752, 300], [752, 380]], { cue: 'a set of API contracts', delay: 0.4, pulse: true }),
        node('opsramp', 402, 380, 700, 150, 'OpsRamp SaaS', { sub: 'GreenLake service onboarder', tone: 'solid', chips: ['Region A', 'Region B', 'Region C'], cue: 'The first phase made OpsRamp' }),
        edge('e-cds', [[1102, 455], [1310, 455], [1310, 92]], { label: 'consumption data', labelAlign: 'left', labelAt: [1328, 300], cue: 'reporting OpsRamp consumption data', pulse: true })
      ],
      beats: [
        beat('It is one door', 'glow', ['greenlake', 'opsramp'], { hold: 2.0 }),
        beat('Watch this band', 'glow', 'band', { hold: 1.2 }),
        beat('most important object', 'glow', 'band', { hold: 2.4 }),
        beat('The platform owns them', 'glow', 'greenlake', { hold: 1.4 }),
        beat('OpsRamp honors the contract', 'glow', 'band', { hold: 2.0 })
      ]
    }
  },
  {
    id: '04-packaging',
    chapter: 'Commercial packaging',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 1 · COMMERCIAL MOTIONS',
    title: 'One product, two HPE commercial motions.',
    support: 'GreenLake Flex and HPE Complete Care, on the same contract.',
    status: PART1,
    vo: `With the platform plumbing in place, we added a consumption model. OpsRamp can be bundled with any GreenLake Flex offer as the Hybrid Observability SKU. We also integrated with HPE Support Center, so OpsRamp is part of the HPE Complete Care offering. The same product, on the same contract, now reaches customers through two major HPE commercial motions.`,
    diagram: {
      items: [
        node('opsramp', 622, 20, 500, 130, 'OpsRamp', { sub: 'On the GreenLake contract', tone: 'solid', cue: 'With the platform plumbing' }),
        edge('e-model', [[872, 150], [872, 220]], { cue: 'we added a consumption model' }),
        node('model', 622, 220, 500, 100, 'Consumption model', { tone: 'green', compact: true, cue: 'we added a consumption model', delay: 0.3 }),
        edge('e-flex', [[622, 270], [410, 270], [410, 400]], { cue: 'any GreenLake Flex offer' }),
        node('flex', 60, 400, 700, 170, 'Any GreenLake Flex offer', { sub: 'OpsRamp as the Hybrid Observability SKU', tone: 'green', cue: 'any GreenLake Flex offer', delay: 0.4 }),
        edge('e-care', [[1122, 85], [1334, 85], [1334, 400]], { cue: 'integrated with HPE Support Center' }),
        node('care', 984, 400, 700, 170, 'HPE Complete Care', { sub: 'Through the HPE Support Center integration', tone: 'green', cue: 'integrated with HPE Support Center', delay: 0.4 })
      ],
      beats: [beat('two major HPE commercial motions', 'glow', ['flex', 'care'], { hold: 2.4 })]
    }
  },
  {
    id: '05-melody',
    chapter: 'The Melody bus',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 1 · MELODY DATA EXCHANGE',
    title: 'OpsRamp data powers other GreenLake services.',
    support: 'One bus, four consumers, one source of observed truth.',
    status: PART1,
    vo: `Next, OpsRamp joined the Melody data exchange bus, and its data started powering other GreenLake services. Aruba Central CNX delivers third-party network observability, and the data behind it comes from OpsRamp, streamed into Aruba Central over Melody. Third-party compute and storage that OpsRamp discovers is shared, over the same bus, with the GreenLake Asset Service. OpsRamp data also flows to the GreenLake Sustainability Insights Center. And OpsRamp powers metering for close to twenty-six Flex services. That metering data travels over Melody to Consumption Data Services and GreenLake Billing Manager, enriched with Billing Manager offer IDs. One bus, four consumers, and in each case OpsRamp is the source of observed truth.`,
    diagram: {
      items: [
        node('opsramp', 622, 0, 500, 120, 'OpsRamp', { sub: 'Source of observed truth', tone: 'solid', cue: 'OpsRamp joined the Melody' }),
        edge('e-bus', [[872, 120], [872, 196]], { cue: 'Melody data exchange bus', delay: 0.5, pulse: true }),
        node('bus', 0, 196, 1744, 60, 'Melody data exchange bus', { type: 'bus', cue: 'Melody data exchange bus' }),
        edge('e-aruba', [[200, 256], [200, 340]], { cue: 'Aruba Central CNX delivers', pulse: true }),
        node('aruba', 0, 340, 400, 200, 'Aruba Central CNX', { sub: 'Third-party network observability, powered by OpsRamp data', tone: 'green', cue: 'Aruba Central CNX delivers', delay: 0.2 }),
        edge('e-glas', [[648, 256], [648, 340]], { cue: 'with the GreenLake Asset Service', pulse: true }),
        node('glas', 448, 340, 400, 200, 'GLAS', { sub: 'GreenLake Asset Service · discovered third-party compute and storage', tone: 'green', cue: 'with the GreenLake Asset Service', delay: 0.2 }),
        edge('e-sic', [[1096, 256], [1096, 340]], { cue: 'Sustainability Insights Center', pulse: true }),
        node('sic', 896, 340, 400, 200, 'SIC', { sub: 'GreenLake Sustainability Insights Center', tone: 'green', cue: 'Sustainability Insights Center', delay: 0.2 }),
        edge('e-meter', [[1544, 256], [1544, 340]], { cue: 'OpsRamp powers metering', pulse: true }),
        node('meter', 1344, 340, 400, 200, 'Metering', { sub: '~26 Flex services → CDS and GreenLake Billing Manager, with offer IDs', tone: 'green', cue: 'OpsRamp powers metering', delay: 0.2 })
      ],
      beats: [
        beat('One bus, four consumers', 'glow', ['aruba', 'glas', 'sic', 'meter'], { hold: 1.8 }),
        beat('the source of observed truth', 'glow', 'opsramp', { hold: 2.2 })
      ]
    }
  },
  {
    id: '06-one-click',
    chapter: 'One click',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 1 · NATIVE EXPERIENCE',
    title: 'One click from the GreenLake Integrations page.',
    support: 'An onboarding project became one action.',
    status: PART1,
    vo: `Powering the Asset Service required a native experience. From the GreenLake Integrations page, a single click now provisions an OpsRamp workspace, sets up the subscription, creates the users, and launches OpsRamp. What used to be an onboarding project is now one action, driven entirely through the platform contract.`,
    diagram: {
      items: [
        node('page', 0, 40, 700, 470, 'GreenLake · Integrations', { tone: 'platform', top: true, cue: 'From the GreenLake Integrations page' }),
        node('tile', 40, 130, 620, 280, 'OpsRamp', { sub: 'Observability and operations', top: true, cue: 'From the GreenLake Integrations page', delay: 0.3 }),
        node('button', 80, 300, 280, 70, 'Launch', { type: 'button', cue: 'From the GreenLake Integrations page', delay: 0.5 }),
        { type: 'cursor', id: 'cursor', x: 470, y: 440, cue: 'From the GreenLake Integrations page', delay: 0.8 },
        edge('e-steps', [[700, 275], [880, 275]], { cue: 'a single click', delay: 0.5 }),
        node('s1', 900, 40, 844, 96, 'Workspace provisioned', { check: true, compact: true, cue: 'provisions an OpsRamp workspace' }),
        node('s2', 900, 160, 844, 96, 'Subscription set up', { check: true, compact: true, cue: 'sets up the subscription' }),
        node('s3', 900, 280, 844, 96, 'Users created', { check: true, compact: true, cue: 'creates the users' }),
        node('s4', 900, 400, 844, 96, 'OpsRamp launched', { check: true, compact: true, cue: 'and launches OpsRamp' }),
        node('contract', 900, 536, 844, 76, 'Driven entirely through the platform contract', { tone: 'ghost', compact: true, cue: 'driven entirely' })
      ],
      beats: [
        beat('a single click', 'move', 'cursor', { to: [220, 335], duration: 0.7, lead: 0.8 }),
        beat('a single click', 'click', 'cursor', { delay: 0.05 }),
        beat('a single click', 'glow', 'button', { hold: 0.8, delay: 0.05 }),
        beat('now one action', 'glow', ['s1', 's2', 's3', 's4'], { hold: 1.6 })
      ]
    }
  },
  {
    id: '07-morpheus',
    chapter: 'Morpheus',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 1 · PRIVATE CLOUD ENTERPRISE AND EDGE COMPUTE',
    title: 'The OpsRamp plugin for Morpheus, in both directions.',
    support: 'Tenancy mapped across Morpheus, OpsRamp, and GreenLake.',
    status: PART1,
    vo: `In parallel, OpsRamp has always been part of HPE Private Cloud Enterprise and the Edge Compute as a Service offering with Morpheus. That meant mapping Morpheus tenancy to OpsRamp tenancy, while also mapping GreenLake tenants to OpsRamp tenants. Today this is delivered through an OpsRamp plugin for Morpheus. An administrator creates an API key in the OpsRamp client that belongs to an existing GreenLake workspace, and enters it when installing the plugin. From then on, every VM that Morpheus provisions gets an OpsRamp agent as it is provisioned, already configured to connect. The plugin sends resources, resource types, metrics, and the resource hierarchy into the matching OpsRamp tenant. Inside the Morpheus interface, a dedicated OpsRamp tab deep-links straight to the resource in OpsRamp, with no additional login. In the other direction, every OpsRamp resource carries a link back to its details in Morpheus. The Morpheus appliances themselves are onboarded to OpsRamp, so one place monitors all of them in the tenant. And one note on roles. Morpheus Central is a cloud API aggregation point that routes requests to on-prem Morpheus instances. Observability and operations are OpsRamp.`,
    diagram: {
      items: [
        zone('z-morpheus', 0, 0, 700, 500, 'Morpheus', { cue: 'offering with Morpheus' }),
        zone('z-opsramp', 1044, 0, 700, 500, 'OpsRamp tenant · GreenLake workspace', { cue: 'OpsRamp has always been part' }),
        node('mt', 0, 536, 520, 80, 'Morpheus tenant', { compact: true, cue: 'mapping Morpheus tenancy' }),
        edge('e-mt', [[520, 576], [612, 576]], { arrow: 'both', cue: 'to OpsRamp tenancy' }),
        node('ot', 612, 536, 520, 80, 'OpsRamp tenant', { tone: 'solid', compact: true, cue: 'to OpsRamp tenancy' }),
        edge('e-gt', [[1224, 576], [1132, 576]], { arrow: 'both', cue: 'mapping GreenLake tenants' }),
        node('gt', 1224, 536, 520, 80, 'GreenLake tenant', { tone: 'platform', compact: true, cue: 'mapping GreenLake tenants' }),
        node('plugin', 30, 56, 640, 96, 'OpsRamp plugin for Morpheus', { tone: 'solid', compact: true, cue: 'an OpsRamp plugin for Morpheus' }),
        node('apikey', 1074, 56, 640, 96, 'API key · OpsRamp client', { sub: 'Belongs to an existing GreenLake workspace', compact: true, cue: 'creates an API key' }),
        edge('e-key', [[1074, 104], [670, 104]], { label: 'entered at plugin install', cue: 'enters it when installing' }),
        node('vm1', 30, 176, 200, 96, 'VM', { sub: '+ OpsRamp agent', tone: 'green', compact: true, cue: 'every VM that Morpheus provisions' }),
        node('vm2', 250, 176, 200, 96, 'VM', { sub: '+ OpsRamp agent', tone: 'green', compact: true, cue: 'every VM that Morpheus provisions', delay: 0.35 }),
        node('vm3', 470, 176, 200, 96, 'VM', { sub: '+ OpsRamp agent', tone: 'green', compact: true, cue: 'every VM that Morpheus provisions', delay: 0.7 }),
        edge('e-tele', [[670, 224], [1074, 224]], { cue: 'The plugin sends resources', pulse: true }),
        node('tele', 1074, 176, 640, 96, 'Resources · types · metrics · hierarchy', { sub: 'Into the matching OpsRamp tenant', tone: 'green', compact: true, cue: 'The plugin sends resources', delay: 0.4 }),
        node('tab', 30, 296, 640, 84, 'OpsRamp tab in the Morpheus UI', { compact: true, cue: 'a dedicated OpsRamp tab' }),
        node('res', 1074, 296, 640, 84, 'OpsRamp resource', { compact: true, cue: 'deep-links straight to the resource' }),
        edge('e-tab', [[670, 322], [1074, 322]], { label: 'deep link · no extra login', cue: 'deep-links straight to the resource' }),
        edge('e-back', [[1074, 356], [670, 356]], { label: 'link back to Morpheus', labelSide: 'below', cue: 'carries a link back' }),
        node('appliances', 1074, 404, 640, 76, 'Morpheus appliances, monitored in OpsRamp', { compact: true, tone: 'green', cue: 'The Morpheus appliances themselves' }),
        node('central', 712, 404, 320, 96, 'Morpheus Central', { sub: 'Cloud API aggregation only', tone: 'ghost', compact: true, cue: 'Morpheus Central is a cloud' })
      ],
      beats: [
        beat('The Morpheus appliances themselves', 'glow', 'z-morpheus', { hold: 1.4 }),
        beat('Observability and operations are OpsRamp', 'glow', 'z-opsramp', { hold: 2.4 })
      ]
    }
  },
  {
    id: '08-part-one-recap',
    chapter: 'What Part 1 built',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 1 · RECAP',
    title: 'Every link is a contract with something outside OpsRamp.',
    support: 'Identity, consumption, data, and workloads.',
    status: PART1,
    vo: `Step back and look at what this first part built. OpsRamp relies on GreenLake for identity, tenancy, subscriptions, users, and notifications. It reports consumption to the platform. It feeds data to Aruba Central, the Asset Service, the Sustainability Insights Center, and Billing Manager. And it is wired into Morpheus from the first VM. Every one of these is a contract with something outside OpsRamp. Keep that in mind, because the next part asks what happens to those contracts when the cloud is not there.`,
    diagram: {
      items: [
        node('opsramp', 672, 250, 400, 130, 'OpsRamp SaaS', { tone: 'solid', cue: 'Step back and look' }),
        node('band', 372, 0, 1000, 100, 'GreenLake contract', { type: 'band', chips: SOCKETS, cue: 'relies on GreenLake for identity' }),
        edge('e-band', [[872, 250], [872, 100]], { cue: 'relies on GreenLake for identity', delay: 0.3 }),
        node('cds', 0, 150, 440, 90, 'CDS', { sub: 'Consumption reporting', compact: true, tone: 'green', cue: 'reports consumption' }),
        edge('e-cds', [[672, 290], [560, 290], [560, 195], [440, 195]], { cue: 'reports consumption', delay: 0.2 }),
        node('morpheus', 0, 400, 440, 90, 'Morpheus plugin', { sub: 'From the first VM', compact: true, tone: 'green', cue: 'wired into Morpheus' }),
        edge('e-morpheus', [[672, 345], [560, 345], [560, 445], [440, 445]], { cue: 'wired into Morpheus', delay: 0.2 }),
        node('aruba', 1304, 130, 440, 76, 'Aruba Central', { compact: true, tone: 'green', cue: 'data to Aruba Central' }),
        edge('e-aruba', [[1072, 300], [1188, 300], [1188, 168], [1304, 168]], { cue: 'data to Aruba Central' }),
        node('glas', 1304, 230, 440, 76, 'Asset Service', { compact: true, tone: 'green', cue: 'the Asset Service' }),
        edge('e-glas', [[1072, 310], [1188, 310], [1188, 268], [1304, 268]], { cue: 'the Asset Service' }),
        node('sic', 1304, 330, 440, 76, 'Sustainability Insights Center', { compact: true, tone: 'green', cue: 'the Sustainability Insights Center' }),
        edge('e-sic', [[1072, 320], [1188, 320], [1188, 368], [1304, 368]], { cue: 'the Sustainability Insights Center' }),
        node('glbm', 1304, 430, 440, 76, 'Billing Manager', { compact: true, tone: 'green', cue: 'and Billing Manager' }),
        edge('e-glbm', [[1072, 330], [1188, 330], [1188, 468], [1304, 468]], { cue: 'and Billing Manager' }),
        node('question', 372, 540, 1000, 80, 'What happens to these contracts when the cloud is not there?', { tone: 'amber', compact: true, cue: 'what happens to those contracts' })
      ],
      beats: [
        beat('Every one of these is a contract', 'glow', ['e-band', 'e-cds', 'e-morpheus', 'e-aruba', 'e-glas', 'e-sic', 'e-glbm'], { hold: 2.4 }),
        beat('Keep that in mind', 'dim', ['band', 'cds', 'morpheus', 'aruba', 'glas', 'sic', 'glbm'], { to: 0.45 })
      ]
    }
  },
  {
    id: '09-managed-on-prem',
    chapter: 'Managed on-prem',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 2 · HPE-MANAGED',
    title: 'Managed on-prem: local software, cloud operators.',
    support: 'HPE Managed Services operates it through the Global Health Console.',
    status: PART2,
    vo: `While the GreenLake work continued, OpsRamp also went on-premises. The first form was managed on-prem. OpsRamp runs at the customer site, and HPE Managed Services operates it from the cloud through the Global Health Console. The software is local, but the operators and their console are still in the HPE cloud. That split works when HPE can reach the site. It does not serve the customer who wants to run OpsRamp themselves.`,
    diagram: {
      items: [
        zone('z-cloud', 0, 0, 700, 620, 'HPE cloud', { cue: 'operates it from the cloud' }),
        zone('z-site', 1044, 0, 700, 620, 'Customer site', { cue: 'OpsRamp also went on-premises' }),
        node('opsramp', 1094, 150, 600, 150, 'OpsRamp on-prem', { sub: 'Runs at the customer site', tone: 'solid', cue: 'OpsRamp runs at the customer site' }),
        node('ghc', 50, 150, 600, 150, 'Global Health Console', { sub: 'Operations console in the HPE cloud', tone: 'green', cue: 'through the Global Health Console' }),
        node('msp', 50, 400, 600, 110, 'HPE Managed Services', { sub: 'The operators', cue: 'HPE Managed Services operates' }),
        edge('e-msp', [[350, 400], [350, 300]], { cue: 'through the Global Health Console' }),
        edge('link', [[650, 225], [1094, 225]], { label: 'managed from the cloud', cue: 'through the Global Health Console', delay: 0.6, pulse: true }),
        node('diy', 1094, 400, 600, 110, 'The customer who wants to run it', { sub: 'Not served by this model', tone: 'amber', cue: 'It does not serve the customer' })
      ],
      beats: [
        beat('still in the HPE cloud', 'glow', ['ghc', 'msp'], { hold: 1.6 }),
        beat('works when HPE can reach the site', 'glow', 'link', { hold: 2.0 })
      ]
    }
  },
  {
    id: '10-darksite',
    chapter: 'Darksite',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 2 · DISCONNECTED',
    title: 'Darksite: no link to HPE at all.',
    support: 'DISA and Greenboat ship OpsRamp alongside other HPE products.',
    status: PART2,
    vo: `The second form removed the cloud entirely. In disconnected offers such as DISA and Greenboat, an on-prem OpsRamp ships alongside other HPE products, with no link to HPE at all. So OpsRamp already runs today in sites that never connect to the cloud.`,
    diagram: {
      items: [
        zone('z-cloud', 0, 0, 700, 620, 'HPE cloud', { cue: null }),
        zone('z-site', 1044, 0, 700, 620, 'Customer site', { cue: null }),
        zone('z-dark', 1044, 0, 700, 620, 'Disconnected site · DISA · Greenboat', { tone: 'amber', cue: 'such as DISA and Greenboat' }),
        node('opsramp', 1094, 150, 600, 150, 'OpsRamp on-prem', { sub: 'Runs at the customer site', tone: 'solid', cue: null }),
        node('ghc', 50, 150, 600, 150, 'Global Health Console', { sub: 'Operations console in the HPE cloud', tone: 'green', cue: null }),
        node('msp', 50, 400, 600, 110, 'HPE Managed Services', { sub: 'The operators', cue: null }),
        edge('e-msp', [[350, 400], [350, 300]], { cue: null }),
        edge('link', [[650, 225], [1094, 225]], { label: 'managed from the cloud', cue: null }),
        node('others', 1094, 400, 600, 110, 'Other HPE products', { sub: 'Shipped in the same offer', cue: 'alongside other HPE products' })
      ],
      beats: [
        beat('removed the cloud entirely', 'break', 'link'),
        beat('removed the cloud entirely', 'dim', ['z-cloud', 'ghc', 'msp', 'e-msp'], { to: 0.28, delay: 0.3 }),
        beat('such as DISA and Greenboat', 'hide', 'z-site'),
        beat('never connect to the cloud', 'glow', 'opsramp', { hold: 2.2 })
      ]
    }
  },
  {
    id: '11-silvercreek',
    chapter: 'Customer-managed on SilverCreek',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 2 · CUSTOMER-MANAGED',
    title: 'Same contract, different GreenLake.',
    support: 'SilverCreek is disconnected GreenLake, running on-premises.',
    status: PART2,
    vo: `Now we are building standalone, customer-managed OpsRamp. Customers install, configure, manage, and monitor it themselves. The platform side comes from SilverCreek, which is disconnected GreenLake running on-premises. SilverCreek provides the same services as the cloud, including authentication, authorization, Consumption Data Services, and the Sustainability Insights Center. Here is the key point. Watch the contract band move. OpsRamp expects SilverCreek to keep exactly the same service onboarder contracts it already uses in the cloud. So an on-prem user gets the same unified authentication, subscriptions, and user management as a user who enters OpsRamp SaaS through the GreenLake cloud front door. Same contract, different GreenLake. We expect that contract to carry one more benefit. In the cloud, platform integration gave our customers a single front door across our clusters. As customers run OpsRamp in more than one place on-prem, we expect SilverCreek to give them that same single front door. It may matter even more on-prem than it does in the cloud. The Morpheus integration we already built carries over as well. One thing changes deliberately. There is no Melody bus on-prem, so where OpsRamp exchanges data with Consumption Data Services on SilverCreek, it uses a direct API. And one thing is still open. The on-prem licensing model is to be decided. It could be based on BRIM.`,
    diagram: {
      items: [
        node('cloud', 422, 0, 900, 60, 'GreenLake cloud', { tone: 'ghost', compact: true, cue: null }),
        node('band', 422, 70, 900, 72, 'Service onboarder contract', { type: 'band', chips: SOCKETS, cue: null }),
        zone('z-dc', 0, 160, 1744, 472, 'Customer data center · customer-managed', { cue: 'customer-managed OpsRamp' }),
        node('silvercreek', 422, 200, 900, 140, 'SilverCreek', {
          sub: 'Disconnected GreenLake, on-premises',
          tone: 'platform',
          cue: 'comes from SilverCreek',
          chips: [
            { text: 'AuthN', cue: 'including authentication' },
            { text: 'AuthZ', cue: 'authentication authorization' },
            { text: 'CDS', cue: 'authorization Consumption Data Services' },
            { text: 'SIC', cue: 'and the Sustainability Insights Center' }
          ]
        }),
        edge('e-or', [[961, 422], [961, 450]], { arrow: false, cue: 'OpsRamp expects SilverCreek' }),
        node('opsramp', 750, 450, 422, 110, 'OpsRamp on-prem', { sub: 'Same product as SaaS', tone: 'solid', cue: 'OpsRamp expects SilverCreek' }),
        edge('e-site2', [[570, 422], [570, 450]], { arrow: false, cue: 'more than one place' }),
        node('site2', 430, 450, 280, 110, 'OpsRamp on-prem', { tone: 'ghost', cue: 'more than one place' }),
        edge('e-morpheus', [[1172, 505], [1360, 505]], { arrow: 'both', label: 'same plugin', cue: 'The Morpheus integration we already built', delay: 0.3 }),
        node('morpheus', 1360, 450, 360, 110, 'Morpheus', { sub: 'Integration carries over', tone: 'green', cue: 'The Morpheus integration we already built' }),
        node('melody', 20, 210, 380, 110, 'No Melody on-prem', { sub: 'Direct API to CDS', tone: 'amber', cue: 'There is no Melody bus on-prem' }),
        node('license', 20, 350, 380, 110, 'Licensing: TBD', { sub: 'Could be BRIM-based', tone: 'amber', cue: 'The on-prem licensing model' })
      ],
      beats: [
        beat('Watch the contract band move', 'move', 'band', { to: [422, 350], duration: 1.8 }),
        beat('Watch the contract band move', 'dim', 'cloud', { to: 0.22, delay: 0.3 }),
        beat('same unified authentication', 'glow', 'band', { hold: 1.8 }),
        beat('Same contract, different GreenLake', 'glow', ['band', 'silvercreek'], { hold: 2.4 }),
        beat('that same single front door', 'glow', ['silvercreek', 'opsramp', 'site2'], { hold: 2.0 })
      ]
    }
  },
  {
    id: '12-hard-problem',
    chapter: 'The hard problem',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 3 · THE HARD PROBLEM',
    title: 'SaaS is run by a team. That team uses OpsRamp.',
    support: 'Ten years of practice we will not re-implement.',
    status: PART3,
    vo: `That leaves the hard problem. On-prem OpsRamp is the same product as SaaS, but SaaS is run around the clock by an OpsRamp SRE and DevOps team, across every cloud cluster. A customer-managed product cannot rely on that team. But that team does not work by hand. OpsRamp uses OpsRamp to manage every OpsRamp instance across the globe. The runbooks, remediation practices, incident management and recovery, and monitoring best practices behind it have been honed over ten years. We are not going to re-implement or reinvent any of that.`,
    diagram: {
      items: [
        node('team', 522, 0, 700, 90, 'OpsRamp SRE and DevOps team', { sub: 'Around the clock', compact: true, cue: 'run around the clock' }),
        node('diy', 0, 0, 420, 110, 'Customer-managed', { sub: 'Cannot rely on that team', tone: 'amber', cue: 'cannot rely on that team' }),
        edge('e-team', [[872, 90], [872, 160]], { cue: 'does not work by hand' }),
        node('ops', 422, 160, 900, 210, 'OpsRamp, managing OpsRamp', {
          sub: 'Every OpsRamp instance across the globe',
          tone: 'solid',
          cue: 'OpsRamp uses OpsRamp',
          chips: [
            { text: 'Runbooks', cue: 'The runbooks' },
            { text: 'Remediation', cue: 'remediation practices' },
            { text: 'Incident recovery', cue: 'incident management' },
            { text: 'Monitoring practice', cue: 'monitoring best practices' }
          ]
        }),
        node('years', 1384, 160, 360, 120, '10 years', { sub: 'Of honed practice', tone: 'green', cue: 'honed over ten years' }),
        node('keep', 1384, 300, 360, 70, 'Not re-implemented', { tone: 'ghost', compact: true, cue: 'We are not going to' }),
        ...[0, 1, 2, 3, 4].flatMap(index => [
          node(`c${index}`, index * 357, 500, 316, 90, 'SaaS cluster', { compact: true, cue: 'across every cloud cluster', delay: index * 0.15 }),
          edge(`e-c${index}`, [[872, 370], [158 + index * 357, 500]], { cue: 'to manage every OpsRamp instance', delay: index * 0.12 })
        ])
      ],
      beats: [beat('We are not going to', 'glow', 'ops', { hold: 2.6 })]
    }
  },
  {
    id: '13-mini-opsramp',
    chapter: 'The mini OpsRamp',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 3 · LOCAL HEALTH CONSOLE',
    title: 'The mini OpsRamp is the Local Health Console.',
    support: 'Operations move into the product as self-service.',
    status: PART3,
    vo: `Instead, we are tucking a mini OpsRamp inside every on-prem deployment. That mini OpsRamp is the Local Health Console, and it carries the same runbooks and practices that run our cloud. Install, configure, monitor, upgrade, and patch become self-service capabilities in the product, rather than tasks for an operations team. And it runs on the virtualized infrastructure customers already have: HPE VM Essentials, VMware, Nutanix, Red Hat, and others. Converting a cloud-native, distributed application, run by a team of operators, into software the customer runs on any of these platforms is a complex engineering task. This is where our time and investment are going.`,
    diagram: {
      items: [
        zone('z-dc', 0, 170, 1744, 350, 'Customer data center', { cue: 'Instead we are tucking' }),
        zone('z-or', 40, 220, 1664, 280, 'OpsRamp on-prem · same product as SaaS', { tone: 'green', cue: 'Instead we are tucking', delay: 0.4 }),
        node('ops', 422, 0, 900, 150, 'OpsRamp, managing OpsRamp', { tone: 'solid', chips: OPS_PRACTICE, cue: null }),
        node('lhc', 80, 270, 700, 200, 'Local Health Console', { sub: 'mini-OR · same runbooks and practices', tone: 'solid', chips: OPS_PRACTICE, cue: 'is the Local Health Console' }),
        node('self', 860, 270, 800, 200, 'Self-service in the product', {
          sub: 'Instead of tasks for an operations team',
          tone: 'green',
          cue: 'Install configure monitor',
          chips: [
            { text: 'Install', cue: 'Install configure' },
            { text: 'Configure', cue: 'configure monitor' },
            { text: 'Monitor', cue: 'monitor upgrade' },
            { text: 'Upgrade', cue: 'upgrade and patch' },
            { text: 'Patch', cue: 'patch become' }
          ]
        }),
        node('i1', 0, 548, 332, 76, 'HPE VM Essentials', { compact: true, cue: 'HPE VM Essentials' }),
        node('i2', 353, 548, 332, 76, 'VMware', { compact: true, cue: 'VMware' }),
        node('i3', 706, 548, 332, 76, 'Nutanix', { compact: true, cue: 'Nutanix' }),
        node('i4', 1059, 548, 332, 76, 'Red Hat', { compact: true, cue: 'Red Hat' }),
        node('i5', 1412, 548, 332, 76, 'And others', { compact: true, tone: 'ghost', cue: 'and others' })
      ],
      beats: [
        beat('a mini OpsRamp inside', 'move', 'ops', { to: [80, 270], scale: 700 / 900, duration: 1.6 }),
        beat('is the Local Health Console', 'hide', 'ops'),
        beat('a complex engineering task', 'glow', 'z-or', { hold: 1.8 }),
        beat('This is where our time', 'glow', ['lhc', 'self'], { hold: 2.4 })
      ]
    }
  },
  {
    id: '14-automation',
    chapter: 'Automation',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 3 · EXECUTION ENGINE',
    title: 'Runbooks execute through an engine that already exists.',
    support: 'Morpheus when present. Otherwise OpsRamp Process Automation.',
    status: PART3,
    vo: `The Local Health Console needs an engine to execute its runbooks. When Morpheus exists in the environment, it uses Morpheus for automation, so the customer keeps one workload plane. When it does not, it uses OpsRamp's built-in Process Automation, a BPM engine with a WYSIWYG workflow designer. Either way, we reuse an engine that already exists.`,
    diagram: {
      items: [
        node('lhc', 572, 0, 600, 130, 'Local Health Console', { sub: 'mini-OR', tone: 'solid', cue: null }),
        edge('e-exec', [[872, 130], [872, 220]], { arrow: false, label: 'executes through', labelAlign: 'left', labelAt: [892, 175], cue: 'needs an engine' }),
        edge('e-left', [[872, 220], [436, 220], [436, 320]], { cue: 'When Morpheus exists' }),
        node('morpheus', 136, 320, 600, 170, 'Morpheus automation', { sub: 'When Morpheus is present · one workload plane', tone: 'green', cue: 'When Morpheus exists', delay: 0.4 }),
        edge('e-right', [[872, 220], [1308, 220], [1308, 320]], { cue: 'When it does not' }),
        node('pa', 1008, 320, 600, 170, 'OpsRamp Process Automation', { sub: 'Built-in BPM · WYSIWYG workflow designer', tone: 'green', cue: 'When it does not', delay: 0.4 }),
        node('reuse', 572, 530, 600, 80, 'Either way: an engine that already exists', { tone: 'ghost', compact: true, cue: 'Either way' })
      ],
      beats: [beat('we reuse an engine', 'glow', ['morpheus', 'pa'], { hold: 2.2 })]
    }
  },
  {
    id: '15-tenant-scope',
    chapter: 'A tenant of its own',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 3 · LOCAL HEALTH CONSOLE',
    title: 'The Health Console runs on the instance it watches.',
    support: 'A special tenant scope: simple to administer, but shared infrastructure.',
    status: PART3,
    vo: `The Local Health Console reuses one more thing: the OpsRamp instance itself. The local application instance, the OpsRamp deployment the customer is running, is onboarded, with monitoring enabled, into a special tenant scope of its own. That makes local administration simple. The customer manages OpsRamp with OpsRamp, right where it runs. But there is a catch. The Health Console now shares the same infrastructure as the production clients. When that infrastructure has a problem, the Health Console is impacted too, at exactly the moment it is needed most. This is where the witness comes in.`,
    diagram: {
      items: [
        zone('z-inst', 0, 0, 1300, 632, 'OpsRamp on-prem instance', { tone: 'green', cue: null }),
        node('scope', 30, 60, 560, 220, 'Special tenant scope', {
          sub: 'The local OpsRamp instance, onboarded',
          tone: 'solid',
          cue: 'into a special tenant scope',
          chips: [
            { text: 'Onboarded', cue: 'is onboarded with' },
            { text: 'Monitoring enabled', cue: 'with monitoring enabled' },
            { text: 'Local Health Console', cue: 'That makes local administration' }
          ]
        }),
        node('c1', 620, 60, 320, 100, 'Production client', { compact: true, cue: null }),
        node('c2', 960, 60, 320, 100, 'Production client', { compact: true, cue: null }),
        node('c3', 620, 180, 320, 100, 'Production client', { compact: true, cue: null }),
        node('c4', 960, 180, 320, 100, 'Production client', { compact: true, cue: null }),
        edge('e-scope', [[310, 440], [310, 280]], { arrow: false, cue: 'shares the same infrastructure' }),
        edge('e-c3', [[780, 440], [780, 280]], { arrow: false, cue: 'shares the same infrastructure', delay: 0.15 }),
        edge('e-c4', [[1120, 440], [1120, 280]], { arrow: false, cue: 'shares the same infrastructure', delay: 0.3 }),
        node('infra', 30, 440, 1250, 150, 'Shared infrastructure', { sub: 'Under the Health Console and the production clients alike', cue: 'shares the same infrastructure' }),
        node('witness', 1360, 60, 384, 220, 'Independent witness', { sub: 'Runs outside the instance', tone: 'amber', cue: 'This is where the witness' }),
        edge('e-watch', [[1360, 170], [590, 170]], { dashed: true, tone: 'amber', cue: 'This is where the witness', delay: 0.4 })
      ],
      beats: [
        beat('The customer manages OpsRamp with OpsRamp', 'glow', 'scope', { hold: 2.0 }),
        beat('the same infrastructure as the production', 'glow', 'infra', { hold: 1.8 }),
        beat('Health Console is impacted', 'break', 'e-scope')
      ]
    }
  },
  {
    id: '16-witness-release',
    chapter: 'Witness and release path',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 3 · WHO WATCHES, HOW IT SHIPS',
    title: 'An independent witness, and signed bundles.',
    support: 'Operational knowledge ships at upgrade and patch time.',
    status: PART3,
    vo: `The witness is an independent health monitor, and it is in development. We require it to run independently of the OpsRamp instance, and of the infrastructure it shares, so a failure inside OpsRamp cannot hide itself. The next question is how new operational knowledge reaches customers. It ships with every upgrade and patch. HPE publishes signed, self-attested bundles to a download site. The customer downloads them, points on-prem OpsRamp at that location, and OpsRamp verifies each bundle before applying it. There is no inbound connection and no outbound dependency. Every release carries what our SaaS operations team has learned since the last one.`,
    diagram: {
      items: [
        zone('z-or', 0, 0, 900, 320, 'OpsRamp on-prem instance', { tone: 'green', cue: null }),
        node('lhc', 40, 70, 560, 200, 'Local Health Console', { sub: 'mini-OR', tone: 'solid', cue: null }),
        node('witness', 1100, 50, 600, 170, 'Independent witness', { sub: 'In development · runs outside the OpsRamp instance', tone: 'amber', cue: 'The witness is an independent' }),
        edge('e-watch', [[1100, 135], [600, 135]], { dashed: true, tone: 'amber', label: 'watches', cue: 'We require it to run' }),
        node('no-link', 1000, 244, 744, 64, 'No inbound connection · no outbound dependency', { tone: 'ghost', compact: true, cue: 'There is no inbound connection' }),
        node('site', 0, 420, 380, 130, 'HPE download site', { sub: 'Signed, self-attested bundles', tone: 'green', cue: 'HPE publishes signed' }),
        edge('e1', [[380, 485], [455, 485]], { cue: 'The customer downloads' }),
        node('laptop', 455, 420, 380, 130, 'Customer laptop', { sub: 'Bundles downloaded', cue: 'The customer downloads', delay: 0.2 }),
        edge('e2', [[835, 485], [910, 485]], { cue: 'points on-prem OpsRamp' }),
        node('point', 910, 420, 380, 130, 'On-prem OpsRamp', { sub: 'Pointed at that location', cue: 'points on-prem OpsRamp', delay: 0.2 }),
        edge('e3', [[1290, 485], [1364, 485]], { cue: 'verifies each bundle' }),
        node('verify', 1364, 420, 380, 130, 'Verify, then apply', { sub: 'Signature checked first', tone: 'solid', cue: 'verifies each bundle', delay: 0.2 }),
        edge('e-apply', [[1554, 420], [1554, 372], [450, 372], [450, 320]], { label: 'every upgrade and patch', labelAt: [1000, 352], cue: 'before applying it', pulse: true })
      ],
      beats: [
        beat('cannot hide itself', 'glow', 'witness', { hold: 2.0 }),
        beat('Every release carries', 'glow', 'lhc', { hold: 2.4 })
      ]
    }
  },
  {
    id: '17-saas-agents',
    chapter: 'SaaS investment lands on-prem',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 3 · BUILT ONCE, FOR BOTH',
    title: 'What SaaS is building lands in the on-prem product.',
    support: 'Agents and in-product learning, built once for both.',
    status: PART3,
    vo: `And the investment already under way in OpsRamp SaaS comes to on-prem as well, because it is the same product. The SaaS team is building an Onboarding Agent, an Integrations Agent, and a Dashboards Agent, along with in-product demo, teach, and learn capabilities. The Onboarding Agent simplifies onboarding. The Integrations Agent simplifies monitoring management. The Dashboards Agent turns natural language into dashboards. And demo, teach, and learn put self-enablement right inside the product. All of it lands in the on-prem product. It is built once, for both. For a customer running OpsRamp without our operations team, that simplicity matters even more.`,
    diagram: {
      items: [
        zone('z-saas', 0, 0, 1744, 250, 'OpsRamp SaaS · being built now', { cue: null }),
        node('a1', 18, 70, 400, 140, 'Onboarding Agent', { tone: 'solid', cue: 'building an Onboarding Agent' }),
        node('a2', 454, 70, 400, 140, 'Integrations Agent', { tone: 'solid', cue: 'an Integrations Agent and' }),
        node('a3', 890, 70, 400, 140, 'Dashboards Agent', { tone: 'solid', cue: 'a Dashboards Agent along' }),
        node('a4', 1326, 70, 400, 140, 'Demo · Teach · Learn', { sub: 'In-product', tone: 'solid', cue: 'in-product demo teach and learn' }),
        zone('z-onprem', 0, 340, 1744, 292, 'OpsRamp on-prem · same product, built once', { tone: 'green', labelBottom: true, cue: 'All of it lands' }),
        ...[0, 1, 2, 3].map(index => edge(`e${index}`, [[218 + index * 436, 210], [218 + index * 436, 410]], { cue: 'All of it lands', delay: 0.3 + index * 0.12 })),
        node('o1', 18, 410, 400, 150, 'Simpler onboarding', { tone: 'green', cue: 'simplifies onboarding' }),
        node('o2', 454, 410, 400, 150, 'Monitoring management', { sub: 'Simplified', tone: 'green', cue: 'simplifies monitoring management' }),
        node('o3', 890, 410, 400, 150, 'Natural-language dashboards', { tone: 'green', cue: 'natural language into dashboards' }),
        node('o4', 1326, 410, 400, 150, 'Self-enablement', { sub: 'Right inside the product', tone: 'green', cue: 'put self-enablement right inside' })
      ],
      beats: [
        beat('It is built once', 'glow', ['a1', 'a2', 'a3', 'a4'], { hold: 1.8 }),
        beat('that simplicity matters', 'glow', ['o1', 'o2', 'o3', 'o4'], { hold: 2.4 })
      ]
    }
  },
  {
    id: '18-sequencing',
    chapter: 'Sequencing',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'PART 3 · SEQUENCING',
    title: 'Self-managing first. Smaller second.',
    support: 'The sequencing is deliberate.',
    status: PART3,
    vo: `The sequencing is deliberate. Initial GA targets large customers, and it solves the self-management problem first. What footprint should you expect at launch? While that is being finalized, and the stack is actively being looked at for optimization, the goal is to fit on-prem OpsRamp into a single two-socket, high-density server, and two for redundancy and availability. Smaller footprints, integrated into HPE Private Cloud platforms, are on the roadmap. A customer-managed product has to operate itself before it can shrink, so the Local Health Console and the witness come first. Self-managing first. Smaller second.`,
    diagram: {
      items: [
        node('ga', 0, 0, 800, 250, 'Initial GA', {
          sub: 'Large customers · self-management solved first',
          tone: 'solid',
          cue: 'targets large customers',
          chips: [
            { text: 'Local Health Console', cue: 'the Local Health Console and' },
            { text: 'Witness', cue: 'and the witness come first' }
          ]
        }),
        edge('e-next', [[800, 125], [944, 125]], { cue: 'Smaller footprints integrated' }),
        node('roadmap', 944, 0, 800, 250, 'Roadmap', { sub: 'Smaller footprints, integrated into HPE Private Cloud platforms', tone: 'ghost', cue: 'Smaller footprints integrated', delay: 0.3 }),
        node('footprint', 0, 290, 1744, 150, 'Launch footprint goal: one two-socket, high-density server', {
          sub: 'Two for redundancy and availability · being finalized, stack being optimized',
          tone: 'green',
          cue: 'the goal is to fit',
          chips: [
            { text: '1 server', cue: 'a single two-socket' },
            { text: '2 for redundancy and availability', cue: 'two for redundancy' }
          ]
        }),
        text('rule', 0, 480, 1744, 80, 'Operate itself before it can shrink.', { size: 'lg', cue: 'has to operate itself' })
      ],
      beats: [
        beat('two for redundancy and availability', 'glow', 'footprint', { hold: 2.0 }),
        beat('Self-managing first', 'glow', ['ga', 'roadmap'], { hold: 2.2 })
      ]
    }
  },
  {
    id: '19-reuse-ledger',
    chapter: 'The reuse ledger',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'CLOSE · THE REUSE LEDGER',
    title: 'We reuse the platform, and our own operations.',
    support: 'Six reused foundations. Two things built new.',
    status: 'CLOSE · THE REUSE LEDGER',
    vo: `Here is the whole picture in one place. Look at what on-prem OpsRamp reuses. Authentication, authorization, tenancy, subscriptions, users, and notifications come from SilverCreek, on the same contract we use in the cloud. Workload provisioning and tenancy come from Morpheus, through a plugin that already ships. The onboarding, integrations, and dashboards agents being built in SaaS arrive in the same product. Observability and operations are the same OpsRamp codebase. Automation is Morpheus, or our own Process Automation. And the operating knowledge is ten years of our own runbooks, packaged rather than reinvented. What we are building new is the Local Health Console that puts those operations inside the product, and the packaging that lets OpsRamp run, and run itself, on the customer's infrastructure.`,
    diagram: {
      items: [
        row('r1', 0, 'Identity, tenancy, subscriptions, users, notifications', 'SilverCreek · the same contract as the cloud', 'Reused', 'Authentication authorization tenancy'),
        row('r2', 66, 'Workload provisioning and tenancy', 'Morpheus · a plugin that already ships', 'Reused', 'Workload provisioning'),
        row('r3', 132, 'Onboarding, integrations, dashboards agents', 'Being built in OpsRamp SaaS · same product', 'Reused', 'The onboarding integrations and dashboards agents'),
        row('r4', 198, 'Observability and operations', 'The same OpsRamp codebase', 'Reused', 'the same OpsRamp codebase'),
        row('r5', 264, 'Automation', 'Morpheus, or OpsRamp Process Automation', 'Reused', 'Automation is Morpheus'),
        row('r6', 330, 'Operating knowledge', 'Ten years of OpsRamp runbooks, packaged', 'Reused', 'the operating knowledge'),
        { type: 'rule', id: 'divider', x: 0, y: 408, w: 1744, label: 'Built new', cue: 'What we are building new' },
        row('n1', 440, 'Local Health Console', 'Operations inside the product', 'New', 'the Local Health Console that'),
        row('n2', 506, 'Any-infrastructure packaging', 'OpsRamp runs, and runs itself, on customer infrastructure', 'New', 'the packaging that lets')
      ],
      beats: [
        beat('packaged rather than reinvented', 'glow', ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'], { hold: 1.8 }),
        beat('on the customer\'s infrastructure', 'glow', ['n1', 'n2'], { hold: 2.4 })
      ]
    }
  },
  {
    id: '20-the-answer',
    chapter: 'The answer',
    kind: 'diagram',
    theme: 'dark',
    eyebrow: 'CLOSE · THE ANSWER',
    title: 'Are we building a second platform?',
    support: 'Back to the question we started with.',
    status: 'CLOSE · THE ANSWER',
    tail: 6,
    vo: `So, back to the question we started with. Are we building a second platform? No. We are taking one product, the same OpsRamp that runs as SaaS today, and teaching it to run itself. The platform comes from GreenLake, through SilverCreek. The workloads come from Morpheus. The operations come from ten years of running OpsRamp ourselves. And what our SaaS team learns keeps arriving, with every release. One product. One contract. Our own operations, now on the customer's infrastructure. We reuse the platform, and we reuse our own operations. Thank you.`,
    diagram: {
      items: [
        text('no', 0, 0, 1744, 170, 'No.', { size: 'xl', cue: '[No] We are taking' }),
        text('same', 0, 176, 1744, 50, 'The same OpsRamp, taught to run itself.', { size: 'md', cue: 'teaching it to run itself' }),
        node('p1', 0, 250, 416, 150, 'GreenLake platform', { sub: 'Through SilverCreek', tone: 'green', cue: 'The platform comes from GreenLake' }),
        node('p2', 442, 250, 416, 150, 'Morpheus', { sub: 'The workloads', tone: 'green', cue: 'The workloads come from Morpheus' }),
        node('p3', 884, 250, 416, 150, 'Ten years of operations', { sub: 'Running OpsRamp ourselves', tone: 'green', cue: 'The operations come from ten years' }),
        node('p4', 1326, 250, 418, 150, 'Every release', { sub: 'What our SaaS team learns', tone: 'green', cue: 'keeps arriving with every release' }),
        text('one', 0, 430, 1744, 50, 'One product · One contract · Our own operations', { size: 'md', cue: 'One product One contract' }),
        text('msg', 0, 490, 1744, 80, 'We reuse the platform, and we reuse our own operations.', { size: 'lg', tone: 'accent', cue: 'We reuse the platform' }),
        text('thanks', 0, 580, 1744, 50, 'HPE OpsRamp · On-prem architecture journey · Thank you', { size: 'md', cue: 'Thank you' })
      ],
      beats: [
        beat('One product One contract', 'glow', ['p1', 'p2', 'p3', 'p4'], { hold: 2.0 }),
        beat('We reuse the platform', 'dim', ['p1', 'p2', 'p3', 'p4', 'same'], { to: 0.35 })
      ]
    }
  }
]
