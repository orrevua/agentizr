# 13 — Frontend: Workflow Canvas (n8n-style)

**Status:** Draft
**Date:** 2026-06-23
**Related:** `10-workspace-data-model.md`, `12-frontend-workspace-and-tabs.md`

## Goal
A visual workflow editor below the agent tabs. Users drag nodes (one per agent), draw edges between them, and label each edge with a handoff condition. State is fully controlled by React Hook Form (canvas is a thin view over `workspace.workflow`). Library: `@xyflow/react` (React Flow v12, MIT). Desktop-only editing; mobile shows read-only diagram + notice.

## Decisions

- **`@xyflow/react` is the only third-party dependency added.** No `dagre`, no `elkjs` — initial node positions are computed by a tiny pure `autoLayout(index)` function (grid: `{ x: 80 + (i%4)*240, y: 80 + Math.floor(i/4)*180 }`). User can drag to override.
- **Controlled state, always.** `<ReactFlow nodes={...} edges={...} onNodesChange={...} onEdgesChange={...} onConnect={...} />` — no `useNodesState`/`useEdgesState`. State source is RHF via a single `Controller` around the canvas.
- **Nodes map 1:1 with agents.** The tabs controller (spec 12 Unit 4) already maintains this invariant. The canvas does **not** add/remove nodes itself — adding a node is "add a tab".
- **Edges are user-authored in the canvas only.** They never appear via the agent form. Edge label = the handoff `condition` (free text) backed by a dropdown of catalog conditions (spec 11 Unit 8). Free-text editable.
- **Custom node component** shows: agent display name (bold), truncated description (1 line, ellipsis), `@slug` muted small. Two handles (left = target, right = source) per node.
- **Empty state:** when `agents.length === 1`, show a placeholder "Add another agent to define handoffs" overlay instead of the canvas.
- **Mobile fallback:** when `window.matchMedia('(max-width: 768px)').matches`, render a static Mermaid SVG (computed client-side via `mermaid` lib — already a candidate; if not desired, fall back to a text list of edges). **Decision:** render a read-only React Flow with `nodesDraggable={false}`, `nodesConnectable={false}`, `edgesUpdatable={false}`, plus an `<Alert>` "Open on desktop to edit". Avoids adding `mermaid` to the frontend bundle.
- **No barrel files; feature-sliced under `src/features/workflow/`.**

## Feature Folder

```
src/features/workflow/
├── components/
│   ├── WorkflowCanvas.tsx            # Client; React Flow wrapper, controlled
│   ├── WorkflowController.tsx        # Client; RHF Controller wrapping WorkflowCanvas
│   ├── AgentNode.tsx                 # Custom node type
│   ├── HandoffEdgeLabel.tsx          # Edge label editor (Popover with condition combobox)
│   ├── EmptyState.tsx
│   └── MobileNotice.tsx
├── hooks/
│   ├── useHandoffConditions.ts       # TanStack Query → /catalog/handoff-conditions
│   └── useReactFlowProps.ts          # Derives nodes/edges/handlers from workspace value
├── lib/
│   ├── autoLayout.ts                 # pure: index → {x, y}
│   ├── toReactFlow.ts                # pure: (workflow, agents) → { nodes, edges }
│   └── fromReactFlow.ts              # pure: (rfChange, prevWorkflow) → nextWorkflow
└── types.ts
```

## Implementation Units

### Unit 1 — Install `@xyflow/react` + base styles
- **Files:** `frontend/package.json`, `frontend/src/app/globals.css` (import `@xyflow/react/dist/style.css`)
- **Change:** `npm i @xyflow/react@^12`. Import the CSS once in the root layout (or `globals.css`).
- **Acceptance:** `npm run build` succeeds with the new dep; bundle stat shows React Flow loaded only on the builder route.

### Unit 2 — `useHandoffConditions` query hook
- **Files:** `src/features/workflow/hooks/useHandoffConditions.ts`, test
- **Change:** Thin `useQuery` over `api('/catalog/handoff-conditions')`. Returns `{ id, label }[]` with locale-resolved label.
- **Acceptance:** Mocked handler returns 4 conditions; hook test passes.

### Unit 3 — Pure adapters: `toReactFlow` + `fromReactFlow` + `autoLayout`
- **Files:** `src/features/workflow/lib/autoLayout.ts`, `toReactFlow.ts`, `fromReactFlow.ts`, sibling tests
- **Change:**
  - `autoLayout(i: number): {x: number, y: number}` — grid formula above.
  - `toReactFlow(workflow, agents)` → React Flow `nodes` (id, type: `'agent'`, position, data: `{name, description, slug}`) and `edges` (id, source, target, label, data: `{condition}`).
  - `fromReactFlow` handles three event kinds via lookup table `{ position: ..., remove: ..., add: ... }` — no if/else cascades. Returns the next `Workflow` object.
- **Acceptance:** Unit tests cover round-trip, position update, edge add, edge delete, node-position-only change.

### Unit 4 — `AgentNode` custom node component
- **Files:** `src/features/workflow/components/AgentNode.tsx`, test
- **Change:** Functional component receiving `data: {name, description, slug}`. Renders a card with two `<Handle>` instances (`type="target" position="left"`, `type="source" position="right"`). Tailwind styling, max-width 220px, single-line truncated description.
- **Acceptance:** Snapshot test or DOM test confirms two handles render and slug appears.

### Unit 5 — `HandoffEdgeLabel` editor
- **Files:** `src/features/workflow/components/HandoffEdgeLabel.tsx`, test
- **Change:** Custom edge label inside React Flow. Click → Popover containing shadcn `Command` listing handoff conditions (from `useHandoffConditions`) plus a free-text input at the top. Selecting an entry sets `edge.data.condition` AND `edge.label`. Free-text on Enter does the same.
- **Acceptance:** Selecting "Task complete" updates RHF state for the edge; typing a custom value sets it instead.

### Unit 6 — `WorkflowCanvas` (uncontrolled→controlled wrapper)
- **Files:** `src/features/workflow/components/WorkflowCanvas.tsx`, test
- **Change:** Props: `{ value: Workflow, agents: AgentDefinition[], onChange: (next: Workflow) => void, readOnly?: boolean }`. Internally: `useMemo` over `toReactFlow(value, agents)`; renders `<ReactFlow nodes={...} edges={...} nodeTypes={{ agent: AgentNode }} edgeTypes={{ default: ... }} onNodesChange={(c) => onChange(fromReactFlow({type:'nodesChange',c}, value))}` etc. `onConnect` adds an edge. When `readOnly`, disable drag/connect.
- **Acceptance:** Test mounts canvas with 2 agents and 0 edges; simulates `onConnect`; asserts `onChange` called with a workflow containing 1 edge.

### Unit 7 — `WorkflowController` (RHF integration)
- **Files:** `src/features/workflow/components/WorkflowController.tsx`, test
- **Change:** Reads `agents` from `useWatch({ name: 'agents' })` (lightweight) and wraps `<Controller name="workflow">` rendering `<WorkflowCanvas value={field.value} onChange={field.onChange} agents={agents} readOnly={isMobile} />`. `isMobile` from a `useMediaQuery('(max-width: 768px)')` hook (define in `src/shared/hooks/useMediaQuery.ts`). When mobile + read-only, render `<MobileNotice/>` above the canvas.
- **Acceptance:** Resizing to ≤768px (via matchMedia mock) shows the notice and disables editing.

### Unit 8 — `EmptyState` (single-agent guard)
- **Files:** `src/features/workflow/components/EmptyState.tsx`, test
- **Change:** Pure component rendered by `WorkflowController` when `agents.length < 2`. Shows an illustration-free card "Add another agent to define handoffs" with a primary button that triggers tab-add via a callback prop.
- **Acceptance:** With one agent, canvas is replaced by the empty state; with two agents, canvas renders.

### Unit 9 — Mount `WorkflowController` into `WorkspaceForm`
- **Files:** `src/features/workspace-builder/components/WorkspaceForm.tsx`
- **Change:** Render `<WorkflowController />` below the `<AgentTabs/>` region, above `<SkillsSection/>`. Section heading "Workflow".
- **Acceptance:** Builder page shows canvas; adding/removing tabs auto-syncs nodes (already wired in spec 12 Unit 4).

### Unit 10 — i18n keys
- **Files:** `frontend/messages/en.json`, `frontend/messages/pt-br.json`
- **Change:** Add `workflow.title`, `workflow.empty`, `workflow.mobileNotice`, `workflow.edgeCondition.placeholder`, etc.
- **Acceptance:** Parity test passes; no hardcoded UI strings in `src/features/workflow/`.

## Out of Scope
- Auto-layout libraries (dagre/elk).
- Group nodes / subflows.
- Undo/redo within the canvas (RHF + React handles change-by-change; full history is post-1.0).
- Per-edge animation styling beyond React Flow defaults.
- Mermaid in the browser — Mermaid lives only in the generated README (server-side).
