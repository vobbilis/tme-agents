import { readFileSync } from 'node:fs'

export const FILM = {
  id: 'opsramp-sdlc-third-cut',
  title: 'OpsRamp AI-first engineering | Third cut',
  width: 1920,
  height: 1080,
  fps: 30,
  voice: 'en-US-AndrewMultilingualNeural', rate: '-12%',
  transitionSeconds: 13 / 30,
  minimumDurationSeconds: 900,
  sourceStatus: 'DRAFT 03 - four supplied recordings; owner-confirmed operating model and three engineers'
}

const text = readFileSync(new URL('../STORYBOARD_REVIEW_V3.md', import.meta.url), 'utf8')
const headings = [...text.matchAll(/^### (\d{2})\. (.+)$/gm)]
const slots = [...text.matchAll(/^\| (\d{2}) \| (\d{2}:\d{2})-(\d{2}:\d{2}) \|/gm)]
const seconds = value => value.split(':').map(Number).reduce((total, part) => total * 60 + part, 0)
const pending = {}
const overrides = {
  S01: {
    title: "OpsRamp's AI-first SDLC model",
    vo: "Welcome to OpsRamp's AI-first SDLC Operating Model. The recorded page sets out the framework and governing principles. This is the stated mandatory baseline: common principles, with local implementation. The model calls for enforcement and validated handoffs; the page describes the standard, not proof that this request satisfied every requirement. Teams can choose how they implement the flows within those principles. Let's follow the incoming feature request from the Private Cloud BU. The goal is to make Azure Local virtual-machine usage available for billing and reporting. The engineering excerpts show the work to add the missing memory and state metrics.",
    points: [
      { text: 'Recorded governing principles', cue: "Welcome to OpsRamp's" },
      { text: 'Stated baseline. Local implementation.', cue: 'This is the stated mandatory baseline' },
      { text: 'Azure Local usage for billing and reporting', cue: 'The goal is to make Azure Local' }
    ]
  },
  S02: {
    title: 'Capture the full intent',
    vo: "Why prepare these Jira fields? The Jira ticket-creation agent captures the full intent and enforces the common fields needed by every downstream flow. The outer product-development lifecycle should produce a fully specified ticket. Here, the author and agent enrich the request together: clarifying the description, acceptance criteria, and breakdown of the work. The agent then creates the ticket, giving the engineering team one shared reference instead of scattered instructions. This mini flow connects the product request to the engineering work that follows.",
    points: [
      { text: 'Jira agent enforces required fields', cue: 'Why prepare these Jira fields' },
      { text: 'Enrich the request with the author', cue: 'Here, the author and agent enrich' },
      { text: 'One ticket guides downstream work', cue: 'The agent then creates the ticket' }
    ]
  },
  S03: {
    title: 'From product request to engineer',
    vo: "Here is OPSEXT-2404, the incoming Private Cloud request. The description connects Azure Local usage to billing and reporting, with five acceptance criteria explaining what the change needs to achieve. Once the ticket is ready, a product manager or engineering manager assigns the work to an individual engineer. That's the outer product-development handoff; we assume it has happened for this demonstration. We are not showing an assignment or approval being made here. The engineer picks up that assigned Jira ticket and starts the engineering flow. On screen, the agent retrieves its description and acceptance criteria, then brings them into the working context. The engineer and the agents now have the same starting point: the customer's intent, the requested outcome, and the questions the analysis needs to resolve.",
    points: [
      { text: 'OPSEXT-2404: intent and criteria', cue: 'Here is OPSEXT-2404' },
      { text: 'Manager assigns the ready ticket', cue: 'Once the ticket is ready' },
      { text: 'Engineer starts from shared context', cue: 'The engineer picks up that assigned Jira ticket' }
    ]
  },
  S04: {
    title: 'The engineer starts agentic flows',
    vo: "Let's see how the individual engineer's flows kick off. The engineer sets the active Jira ticket. In response, the agent reads the feature-automation instructions and checks how the ticket command manages session state. Watch the file reads and searches in the conversation. Here, the agent creates the ticket-linked working state. The response lists the ticket, its summary, and the artifact directory, then reports that the session is ready. Next, the engineer starts the feature-analysis agent. The prompt asks permission to load skills before continuing. The engineer approves that step. We can follow the command, the agent's preparation, the saved state, and the next checkpoint on screen. This is the start of the recorded flow; the following scenes show the context gathering and planning work it leads into.",
    points: [
      { text: 'Set the active Jira ticket', cue: "Let's see how the individual engineer's flows kick off" },
      { text: 'Retain ticket-linked working state', cue: 'Here, the agent creates' },
      { text: 'Feature-analysis agent gathers context', cue: 'Next, the engineer starts the feature-analysis agent' }
    ]
  },
  S05: {
    title: 'Feature analysis learns from prior work',
    vo: "The feature-analysis agent gathers context using repository-level skills. It checks the ticket for linked design and product material, then reads the source and earlier engineering artifacts. There are no linked Figma or Confluence resources here, so it works from the evidence available. Learning from previous work means retrieving those earlier findings, not starting from an empty conversation. There's an important finding here: the Azure Local template already exists and maps to Azure Stack HCI. Repeating the split suggested by the ticket title would miss the actual gap. The missing piece is virtual-machine export content in the Azure Stack HCI configuration. The agent records that finding in the context document, alongside billing and reporting dependencies. Using the repository skills, it will develop the PRD and finish the implementation plan before handing the work to the implementation agent. The handoff carries the reasoning, not just a request to write code.",
    points: [
      { text: 'Repository skills and earlier artifacts', cue: 'The feature-analysis agent gathers context' },
      { text: 'Azure Local template already exists', cue: "There's an important finding here" },
      { text: 'VM export gap informs the next agent', cue: 'The missing piece is virtual-machine export content' }
    ]
  },
  S06: {
    title: 'Requirements for the implementation agent',
    vo: "The PRD brings those findings together as engineering requirements. Watch the feature-analysis agent turn the context into a document the implementation agent can use. It separates the virtual-machine export change from parent mapping, tags, and dependencies owned elsewhere. Those are different pieces of work, and the plan needs to keep them distinct. For these metrics, the memory units and the meaning of virtual-machine state must match what billing and reporting expect. The agent cannot settle that simply by generating a document. It records the open questions instead of silently choosing an answer. The generated PRD gives the next engineer and agent a shared reference, retained with this ticket's artifacts. That is the purpose of this phase: translate product intent into explicit requirements, preserve what is still unresolved, and give the planning step enough detail to define a bounded implementation.",
    points: [
      { text: 'Export work and dependencies', cue: 'The PRD brings those findings together' },
      { text: 'Definitions that need confirmation', cue: 'For these metrics' },
      { text: 'PRD retained for the next agent', cue: 'The generated PRD gives the next engineer and agent' }
    ]
  },
  S07: {
    vo: "Let's look back at the earlier design discussion. The feature-analysis agent compares three approaches: extend the existing export, repeat the template split, or break down the broader initiative first. The source findings make another template split unnecessary, so the agent explores an additive change to the existing configuration. The proof of concept checks whether virtual-machine metadata can be added without disturbing the current configuration. This gives the plan a concrete starting point, but it does not establish live collection. The risk review still needs answers about gateway metrics and parent mapping. Watch those dependencies become entries in the plan rather than disappear from the discussion. The repository skills guide the analysis and the plan review before the next agent starts implementation. Later, the engineer authorizes the limited SQL change, while the parent fields stay marked as pending confirmation."
  },
  S08: {
    title: 'The next engineer takes up the plan',
    vo: "This is the next engineering handoff in our example. The analysis recording ends with planning artifacts and unresolved questions about the implementation. We now move to the implementation engineer's recording of the same request. The question on screen is how to proceed with those open dependencies. The response authorizes the SQL work while leaving parent mapping pending confirmation. In the implementation recording, that becomes a concrete instruction about scope: add the metrics, but do not invent the parent fields. The next prompt asks which release folder should receive the change. The agent refers to the repository's database governance skill before writing the SQL, and asks the engineer to confirm the destination. These exchanges show the plan turning into implementation decisions. The questions remain visible as the work continues. We'll follow that limited change into the export configuration, its requirement trace, and the checks that are actually recorded.",
    points: [
      { text: 'Engineer 2: analysis and plan', cue: 'This is the next engineering handoff' },
      { text: 'Engineer 3: implementation', cue: "We now move to the implementation engineer's recording" },
      { text: 'Open dependencies become explicit decisions', cue: 'In the implementation recording' }
    ]
  },
  S09: {
    title: 'Engineer 3 directs the implementation agent',
    vo: "The engineer authorizes a limited change. Parent mapping stays marked for confirmation, and virtual-machine tags remain deferred. The implementation agent now knows what to change and what not to guess. It checks the target release folder using the repository's SQL governance skill, then works on the export configuration. The change adds Assigned Memory and State for Azure Local virtual machines. These are the two missing metrics identified during analysis. The agent retains the existing configuration rather than replacing the broader service. The trace records the requirements covered and the work still open. That lets the engineer inspect the change against the plan, not just against a plausible-looking diff. This is part of the larger request. Parent mapping, tags, and work owned by downstream teams do not become complete merely because these two metrics have been added. Those boundaries remain in the artifacts passed to delivery.",
    points: [
      { text: 'Limited change authorized', cue: 'The engineer authorizes a limited change' },
      { text: 'Assigned Memory and State', cue: 'The change adds Assigned Memory' },
      { text: 'Implemented and deferred work traced', cue: 'The trace records the requirements covered' }
    ]
  },
  S10: {
    vo: "Testing is part of the implementation agent's phase. The recording shows the agent writing a Python harness, running it, and reporting checks against the authored SQL statement. The response lists the added metrics, preserved content, and idempotency, then records a testing guide. These are the results reported by the agent on screen, not a live database demonstration. The engineer also has to decide what the available environment can validate. Here we look back at the prompt authorizing a SQL validation harness and the agent's check for MySQL. The harness gives structural feedback on the configuration. It cannot establish that a gateway collects the metrics or that billing consumes them correctly. The phase summary marks UI testing as skipped because there is no UI change, and cloud work as skipped because this is not a cloud-resource ticket. The summary preserves both the reported pass and those limits for delivery.",
    points: [
      { text: 'Testing belongs to implementation', cue: "Testing is part of the implementation agent's phase" },
      { text: 'Check the actual deliverable', cue: 'The engineer also has to decide' },
      { text: 'No live runtime validation claimed', cue: 'The harness gives structural feedback' }
    ]
  },
  S11: {
    title: 'Trace validation and repair',
    vo: "The trace fails its schema check. The validator expects a tasks array, while the generated trace used items. The agent reads the validator to understand the mismatch rather than treating the generated file as complete. The recorded repair replaces the incorrect structure, and the check is run again. Follow the sequence in the conversation: the failed command, the schema investigation, and the revised trace. The error changes what the agent does next. It has to inspect the receiving validator and bring its output into the expected format. The updated trace separates the implemented requirements from the deferred items. That gives the next inspection a clearer account of the change. This passage demonstrates a specific validation-and-repair loop. It does not establish that a separate independent reviewer approved the final candidate, and we should not infer that from a heading or a passing structural check.",
    points: [
      { text: 'Schema rejection', cue: 'The trace fails its schema check' },
      { text: 'Repair and rerun', cue: 'The recorded repair replaces' },
      { text: 'Revised trace preserves scope', cue: 'The updated trace separates' }
    ]
  },
  S12: {
    vo: "The delivery agent now reconciles the local change with the repository it will enter. The May release folder is frozen, so the change moves to the September release as a Liquibase changeset, with the listing updated. A change in the wrong release location is not ready because an earlier test passed. Publication then meets another constraint: the authenticated account does not have push permission. The agent reports that boundary instead of bypassing access controls. The local commit remains available, but it is not a published pull request. Finally, the engineer directs the Jira update. The implementation summary and workflow transition make the delivery state visible to the team. A ticket moving to Code Review does not mean the code was merged, deployed, or accepted by Private Cloud. The handoff carries the actual state, including the publication blocker and the need to review the final release-corrected candidate.",
    points: [
      { text: 'Correct the release location', cue: 'The delivery agent now reconciles' },
      { text: 'Publication blocked by permissions', cue: 'Publication then meets another constraint' },
      { text: 'Jira reflects the actual state', cue: 'Finally, the engineer directs the Jira update' }
    ]
  },
  S13: {
    vo: "Now consider what should return to Private Cloud. The Jira implementation summary is a starting point, not the entire handoff. It tells the requester what the engineering work produced and where it stopped. The requirement trace adds the detail: which requirements the change covers, which items were deferred, and which dependencies still belong to other teams. Together, those records support a practical conversation about the next decision. Can the receiving team identify the exact change? Can it see which checks ran, and which live-system checks remain? Is there an owner for the publication blocker and the unresolved metric definitions? These are questions we want to shape with Private Cloud, not answers we claim have already been accepted. The return should connect the original intent to the implementation, its evidence, and the remaining responsibilities. That makes the handoff useful to product and engineering managers as well as to the next engineer. The same principle applies between agents: preserve the information needed to make the next decision, and validate it at the boundary.",
    points: [
      { text: 'Start with the implementation summary', cue: 'Now consider what should return to Private Cloud' },
      { text: 'Carry coverage and unresolved work', cue: 'The requirement trace adds the detail' },
      { text: 'Agree the return handoff together', cue: 'Together, those records support' }
    ]
  },
  S14: {
    title: 'Observability closes the learning loop',
    vo: "The working state connects this session to the Jira ticket. The screen shows the issue key, the initialized state, and the artifact location. Those records let us identify which request this activity belongs to. The implementation record shows a different kind of state: a local change exists, but publication is blocked by permissions. That distinction matters when looking at progress. Code can be written while the next delivery action is still waiting. Here, the agent explains the access limitation and preserves the local commit. We should keep that blocker in the account of the work rather than count the request as delivered. The recordings also show failed checks and the actions taken to repair them. Those are concrete events that can inform a later measurement discussion. They are not, on their own, a complete record of active time, waiting time, or model usage. This cut therefore reports no productivity gain or inferred savings. Back on the operating model, the page calls for observability and improvement. The practical question for our teams is which records we need to demonstrate that principle, including the waiting and blocked work that a completion summary can hide.",
    points: [
      { text: 'Ticket-linked working state', cue: 'The working state connects this session' },
      { text: 'Measure work, waiting, and blockers', cue: 'The implementation record shows a different kind of state' },
      { text: 'Improve from evidence, not inferred savings', cue: 'Back on the operating model' }
    ]
  },
  S15: {
    title: 'One model. Three engineers. Connected phases.',
    vo: "That brings us back to OpsRamp's AI-first SDLC Operating Model: the mandatory baseline, with room for teams to improve their agentic flows. We've followed three engineers preparing the request, developing the analysis and plan, and carrying out implementation and delivery. Within that work, specialist agents execute multi-step phases, connected by shared state, validated artifacts, and human checkpoints. The next part is something we'd like to shape with Private Cloud: what comes back, who needs it, and how it supports the product team's decisions. These records give us a concrete starting point. As we learn from working together, we'll refine the skills, checks, and handoffs while keeping the common governing principles intact.",
    points: [
      { text: 'An enforced baseline across engineers', cue: "That brings us back to OpsRamp's" },
      { text: 'Shape the return together', cue: "The next part is something we'd like to shape" },
      { text: 'Improve the flows within the model', cue: 'As we learn from working together' }
    ]
  }
}

const cues = [
  ["Welcome to OpsRamp's", 'Telemetry records execution', "Let's get into a real"],
  ['Here is OPSEXT-2404', 'The description and acceptance criteria', 'Before deciding what to build'],
  ["Let's look at how", 'The flow works through all required fields', 'A product or engineering manager'],
  ['Engineer two sets', 'Telemetry records how the flow executes', 'The feature-analysis agent loads'],
  ['The analysis agent checks', 'The important finding is', 'The agent saves that finding'],
  ['The feature-analysis agent turns', 'It also retains the questions', 'The implementation agent receives'],
  ['Our engineers use the agents', 'A proof-of-concept phase explores', 'The plan review then examines'],
  ['Engineer three takes up', 'The answer is specific', 'The next checkpoint addresses'],
  ['The implementation agent adds', 'The SQL adds the virtual-machine content', 'Alongside the implementation'],
  ['Testing belongs inside', 'The Python harness parses', 'The phase summary brings'],
  ['The delivery flow checks', 'The agent reads the validator', 'The execution history retains'],
  ['Delivery reconciles', 'Checking the target reveals', 'The earlier implementation decision'],
  ['The publication step encounters', 'The agent preserves the local commit', 'The engineer directs the Jira'],
  ["Now let's connect", 'The test results and testing guide', 'We want to shape that handoff'],
  ['That brings us back', 'Telemetry captured during execution', 'With Private Cloud, the next step']
]

if (headings.length !== 15 || slots.length !== 15) throw new Error('Expected fifteen screenplay scenes and slots')

export const SCENES = headings.map((heading, index) => {
  const body = text.slice(heading.index, headings[index + 1]?.index ?? text.indexOf('\n## Before Another Render'))
  const panels = body.match(/\*\*Right panel:\*\* (.+)/)[1].split(' / ')
  const slot = slots[index]
  if (slot[1] !== heading[1] || panels.length !== cues[index].length) throw new Error(`Scene ${heading[1]}: screenplay structure mismatch`)
  const scene = {
    id: `s${heading[1]}`, chapter: heading[2], title: heading[2],
    slotSeconds: seconds(slot[3]) - seconds(slot[2]),
    programStart: seconds(slot[2]),
    theme: ['01', '08', '14', '15'].includes(heading[1]) ? 'dark' : 'light',
    pending: [],
    status: heading[1] === '14' ? 'PROPOSED RETURN HANDOFF' : 'RECORDED EXCERPTS - owner-confirmed narrative',
    vo: body.match(/^> (.+)$/m)[1],
    points: panels.map((panel, point) => ({ text: panel, cue: cues[index][point] }))
  }
  const spoken = value => value.replace(/\bBU\b/g, 'B U').replace(/\bOPSEXT\b/g, 'O P S E X T')
  return { ...scene, vo: spoken(scene.vo), points: scene.points.map(point => ({ ...point, cue: spoken(point.cue) })) }
})