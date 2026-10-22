# Agentizr — Product & Technical Specification

> **Version:** 0.1.0-draft  
> **Author:** França (orrevua)  
> **Date:** 2026-06-22  
> **Status:** Initial spec — ready for task decomposition  

---

## 1. Vision

Agentizr is a web application inspired by Spring Boot Initializr that lets developers **define an AI coding agent once** through a guided form and **receive a fully scaffolded project structure** — ready to drop into any repository — for every major code-AI platform simultaneously.

**One form → files for Claude Code, GitHub Copilot, OpenAI Codex, Gemini CLI, Cursor, and Windsurf.**

The user fills out fields (agent name, description, instructions, tools, model, scope…), picks target platforms, picks the output language (PT-BR or EN), and downloads a `.zip` (or individual files) containing the correct directory tree, frontmatter, and file formats for each selected platform.

---

## 2. Target Platforms & File-Format Reference

Below is the **canonical mapping** the generator must implement. Every field in the Agentizr form maps to a different serialization per platform.

### 2.1 Claude Code

| Aspect | Detail |
|---|---|
| **Agent file** | `.claude/agents/{slug}.md` |
| **Project rules** | `.claude/rules/{slug}.md` |
| **Root context** | `CLAUDE.md` |
| **Skills** | `.claude/skills/{slug}/SKILL.md` |
| **Global (user)** | `~/.claude/agents/{slug}.md` |
| **Format** | Markdown with YAML frontmatter |
| **Frontmatter fields** | `name`, `description`, `tools` (comma-separated string), `model` (string or `inherit`), `memory` (`user` | `project` | `local`), `keep-coding-instructions` (bool) |
| **Body** | Imperative Markdown instructions |

```markdown
---
name: security-reviewer
description: Scans code for vulnerabilities
tools: "Bash, Read, Grep"
model: inherit
memory: project
---
You are a security expert.
Always check for SQL injection and improper JWT handling.
Never commit directly — present a diff for review.
```

**Skills structure:**
```
.claude/skills/{slug}/
├── SKILL.md          # Frontmatter: name, description
├── scripts/          # Optional executable tools
└── docs/             # Optional reference material
```

### 2.2 GitHub Copilot

| Aspect | Detail |
|---|---|
| **Agent file** | `.github/agents/{slug}.agent.md` (extension `.agent.md` is mandatory) |
| **Scoped instructions** | `.github/instructions/{slug}.instructions.md` |
| **Root instructions** | `.github/copilot-instructions.md` |
| **Global (user)** | `~/.copilot/agents/{slug}.agent.md` |
| **Format** | Markdown with YAML frontmatter |
| **Frontmatter fields** | `name`, `description`, `applyTo` (glob string), `excludeAgent` (string), `tools` (YAML array of strings) |
| **Body** | Markdown instructions |
| **Limits** | Individual instruction files ≤ 6,000 chars; total combined ≤ 12,000 chars |

```markdown
---
name: "security-reviewer"
description: "Scans code for vulnerabilities"
applyTo: "src/auth/**/*.ts, src/crypto/**/*.ts"
tools:
  - "get_symbol_call_hierarchy"
  - "grep"
---
You are a security reviewer.
Focus exclusively on OWASP top 10 vulnerabilities.
```

### 2.3 OpenAI Codex

| Aspect | Detail |
|---|---|
| **Agent file** | `.codex/agents/{slug}.toml` |
| **Registry** | `.codex/config.toml` (append `[agents.{slug_underscored}]` block) |
| **Root instructions** | `AGENTS.md` |
| **Global (user)** | `~/.codex/agents/{slug}.toml` + `~/.codex/config.toml` |
| **Format** | TOML |
| **TOML fields** | `name`, `description`, `developer_instructions` (multiline string), `nickname_candidates` (array), `mcp_servers` (array), `model_reasoning_effort` (`"low"` | `"medium"` | `"high"`) |

```toml
# .codex/agents/security-reviewer.toml
name = "security-reviewer"
description = "Scans code for vulnerabilities"
developer_instructions = """
You are a security expert.
Always check for SQL injection and improper JWT handling.
"""
mcp_servers = ["grep", "read_file"]
model_reasoning_effort = "high"
```

```toml
# Append to .codex/config.toml
[agents.security_reviewer]
description = "Scans code for vulnerabilities"
config_file = "agents/security-reviewer.toml"
```

### 2.4 Gemini CLI

| Aspect | Detail |
|---|---|
| **Agent file** | `.gemini/agents/{slug}.md` |
| **Root context** | `GEMINI.md` |
| **Global (user)** | `~/.gemini/agents/{slug}.md` and `~/.gemini/GEMINI.md` |
| **Format** | Markdown with YAML frontmatter |
| **Frontmatter fields** | `name`, `description`, `model` (optional), `tools` (array), `mcpServers` (array) |
| **Body** | Markdown instructions |
| **Config** | `settings.json` for MCP servers and `context.fileName` override |

```markdown
---
name: frontend-specialist
description: Frontend specialist in building high-performance, accessible web apps.
---
You are a frontend expert.
Use React server components by default.
Ensure all components pass WCAG 2.1 AA.
```

### 2.5 Cursor

| Aspect | Detail |
|---|---|
| **Rule files** | `.cursor/rules/{slug}.mdc` |
| **Legacy (still works)** | `.cursorrules` (single file, no scoping) |
| **Format** | Markdown with YAML frontmatter (`.mdc` extension) |
| **Frontmatter fields** | `description` (string — used for `Agent Requested` activation), `globs` (array of glob patterns — for `Auto Attached`), `alwaysApply` (bool) |
| **Activation modes** | `Always Apply`, `Auto Attached` (globs), `Agent Requested` (description-based), `Manual` (@rule-name) |
| **Limits** | Always-apply rules ≤ 200 words; auto-attached ≤ 500 lines; individual files ≤ 6,000 chars; total ≤ 12,000 chars |

```markdown
---
description: "Security review rules for auth modules"
globs:
  - "src/auth/**/*.ts"
  - "src/crypto/**/*.ts"
alwaysApply: false
---
# Security review
- Always check for SQL injection and improper JWT handling.
- Never commit directly — present a diff for review.
```

### 2.6 Windsurf

| Aspect | Detail |
|---|---|
| **Rule files** | `.windsurf/rules/{slug}.md` |
| **Legacy** | `.windsurfrules` (single file at root) |
| **Format** | Markdown with YAML frontmatter |
| **Frontmatter fields** | `trigger` (`always_on` | `manual` | `model_decision`), `description` |
| **Limits** | Individual ≤ 6,000 chars; total ≤ 12,000 chars |

```markdown
---
trigger: model_decision
description: "Security review for authentication code"
---
You are a security reviewer.
Focus on OWASP top 10 vulnerabilities.
```

### 2.7 Universal AGENTS.md

A cross-platform fallback recognized by Codex CLI, Cursor, Gemini CLI (via config), and many other tools. Agentizr should always offer to generate this as a bonus.

| Aspect | Detail |
|---|---|
| **File** | `AGENTS.md` (project root) |
| **Format** | Pure Markdown, no frontmatter |
| **Content** | Project overview, tech stack, conventions, instructions |

---

## 3. Unified Data Model

The internal schema that the Agentizr form collects and the generator compiles from:

```typescript
interface AgentDefinition {
  // Identity
  slug: string;              // kebab-case, auto-derived from name
  name: string;              // Display name
  description: string;       // One-line summary
  
  // Instructions
  instructions: string;      // Markdown body — imperative voice
  
  // Capabilities
  tools: string[];           // e.g. ["Bash","Read","Grep","WebFetch"]
  mcpServers: string[];      // MCP server names
  
  // Targeting
  applyToGlobs: string[];    // File patterns the agent/rule applies to
  activationMode: 'always' | 'auto' | 'on_demand' | 'manual';
  
  // Model
  model: string;             // e.g. "claude-sonnet-4-6", "inherit", "gpt-4.1"
  reasoningEffort: 'low' | 'medium' | 'high';
  
  // Scope
  scope: 'project' | 'global';
  
  // Memory (Claude-specific but useful to capture)
  memory: 'project' | 'user' | 'local' | 'none';
  
  // Output config
  outputLanguage: 'en' | 'pt-br';
  targetPlatforms: Platform[];
}

type Platform = 
  | 'claude-code'
  | 'copilot'
  | 'codex'
  | 'gemini'
  | 'cursor'
  | 'windsurf';

type GenerationType =
  | 'agent'           // Subagent / custom agent
  | 'rule'            // Project rule / instruction file
  | 'skill'           // Claude skill or Gemini agent skill
  | 'root-context';   // CLAUDE.md / GEMINI.md / AGENTS.md / copilot-instructions.md
```

---

## 4. Generation Engine — Compilation Rules

The generator takes an `AgentDefinition` and produces files per platform. Below is the mapping logic.

### 4.1 Field → Platform Mapping Table

| AgentDefinition field | Claude Code | Copilot | Codex | Gemini | Cursor | Windsurf |
|---|---|---|---|---|---|---|
| `name` | FM `name` | FM `name` | TOML `name` | FM `name` | — (filename) | — (filename) |
| `description` | FM `description` | FM `description` | TOML `description` | FM `description` | FM `description` | FM `description` |
| `instructions` | MD body | MD body | TOML `developer_instructions` | MD body | MD body | MD body |
| `tools` | FM `tools` (comma-sep string) | FM `tools` (YAML array) | TOML `mcp_servers` (array) | FM `tools` (array) | — (not applicable) | — (not applicable) |
| `applyToGlobs` | N/A | FM `applyTo` | N/A | N/A | FM `globs` (array) | N/A |
| `activationMode` | N/A | N/A | N/A | N/A | FM `alwaysApply` + type | FM `trigger` |
| `model` | FM `model` | N/A | N/A | FM `model` | N/A | N/A |
| `reasoningEffort` | N/A | N/A | TOML `model_reasoning_effort` | N/A | N/A | N/A |
| `memory` | FM `memory` | N/A | N/A | N/A | N/A | N/A |
| `scope=project` | `.claude/agents/` | `.github/agents/` | `.codex/agents/` | `.gemini/agents/` | `.cursor/rules/` | `.windsurf/rules/` |
| `scope=global` | `~/.claude/agents/` | `~/.copilot/agents/` | `~/.codex/agents/` | `~/.gemini/agents/` | N/A | N/A |

*FM = YAML Frontmatter*

### 4.2 Cursor `activationMode` Mapping

| `activationMode` | Cursor frontmatter |
|---|---|
| `always` | `alwaysApply: true` |
| `auto` | `alwaysApply: false` + `globs: [...]` |
| `on_demand` | `alwaysApply: false` + `description` only (Agent Requested) |
| `manual` | `alwaysApply: false`, no globs (Manual via @rule-name) |

### 4.3 Windsurf `activationMode` Mapping

| `activationMode` | Windsurf `trigger` |
|---|---|
| `always` | `always_on` |
| `auto` | `model_decision` |
| `on_demand` | `model_decision` |
| `manual` | `manual` |

---

## 5. Output Structure

When the user clicks **Generate**, the system produces a `.zip` with this structure:

```
agentizr-output/
├── README.md                          # Explains what was generated and how to use it
│
├── claude-code/                       # Only if selected
│   ├── .claude/
│   │   └── agents/
│   │       └── {slug}.md
│   └── CLAUDE.md                      # Optional: root context file
│
├── copilot/                           # Only if selected
│   └── .github/
│       ├── agents/
│       │   └── {slug}.agent.md
│       └── copilot-instructions.md    # Optional: root instructions
│
├── codex/                             # Only if selected
│   ├── .codex/
│   │   ├── config.toml
│   │   └── agents/
│   │       └── {slug}.toml
│   └── AGENTS.md                      # Optional: root instructions
│
├── gemini/                            # Only if selected
│   ├── .gemini/
│   │   └── agents/
│   │       └── {slug}.md
│   └── GEMINI.md                      # Optional: root context
│
├── cursor/                            # Only if selected
│   └── .cursor/
│       └── rules/
│           └── {slug}.mdc
│
├── windsurf/                          # Only if selected
│   └── .windsurf/
│       └── rules/
│           └── {slug}.md
│
└── universal/                         # Always generated
    └── AGENTS.md                      # Cross-platform fallback
```

### 5.1 Alternative Output Modes

The user can choose:

1. **Merged tree** — A single flat directory tree where all platform files coexist (the way they would live in a real repo). Conflict: none, because each platform uses its own subdirectory (`.claude/`, `.github/`, `.codex/`, etc.).
2. **Per-platform folders** — Separated as shown above (default for clarity).
3. **Single-platform** — Only the chosen platform's files.

### 5.2 Output Language

All generated instruction text (the Markdown body, comments, README) must respect the user's chosen language:

- `en` — English (default)
- `pt-br` — Brazilian Portuguese

The YAML/TOML keys and directory structure remain in English (they are platform-mandated). Only the human-readable content is translated.

---

## 6. Generation Types

Besides agents, Agentizr should support generating:

### 6.1 Agent (Subagent)
Custom named agent callable via @mention. Primary use case. See sections above.

### 6.2 Rule / Instruction
Project-scoped rules that load contextually (Cursor `.mdc`, Windsurf rules, Copilot `.instructions.md`, Claude `.claude/rules/*.md`).

Form differences from agent: no `name` frontmatter field, emphasis on `globs`/`activationMode`.

### 6.3 Skill (Claude Code / Gemini)
A directory containing `SKILL.md` with frontmatter (`name`, `description`), optional scripts, and optional docs.

```
.claude/skills/{slug}/
├── SKILL.md
├── scripts/
│   └── analyze.py    # Optional tool scripts
└── docs/
    └── reference.md  # Optional reference docs
```

Gemini equivalent: Agent Skills follow a similar directory pattern within `.gemini/`.

### 6.4 Root Context File
The project-wide instruction file (`CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, `.github/copilot-instructions.md`). A separate form flow optimized for WHAT/WHY/HOW structure:

- **WHAT** — Tech stack, project structure, app map
- **WHY** — Purpose, domain, business context
- **HOW** — Build/test/deploy commands, workflows, conventions

---

## 7. UI / UX Specification

### 7.1 Layout Concept

The UI mirrors Spring Initializr's simplicity: a single-page form with a sidebar for platform selection and a main area for fields.

```
┌─────────────────────────────────────────────────────────┐
│  ⚡ Agentizr                                    [PT|EN] │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  PLATFORMS   │  AGENT DEFINITION                        │
│  ☑ Claude    │                                          │
│  ☑ Copilot   │  Name: [__________________________]     │
│  ☑ Codex     │  Description: [___________________]     │
│  ☑ Gemini    │  Type: [Agent ▾]                        │
│  ☐ Cursor    │  Instructions:                          │
│  ☐ Windsurf  │  ┌────────────────────────────────┐     │
│              │  │ You are a security expert.     │     │
│  SCOPE       │  │ Always check for SQL injection │     │
│  ○ Project   │  └────────────────────────────────┘     │
│  ○ Global    │  Tools: [Bash] [Read] [+ Add]           │
│              │  Globs: [src/auth/**/*.ts] [+ Add]      │
│  OUTPUT      │  Activation: [Auto ▾]                   │
│  ○ Merged    │  Model: [inherit ▾]                     │
│  ○ Separate  │  Memory: [project ▾]                    │
│              │                                          │
│              │  ┌──────────┐  ┌────────────────────┐   │
│              │  │ PREVIEW  │  │ ⚡ GENERATE (.zip) │   │
│              │  └──────────┘  └────────────────────┘   │
└──────────────┴──────────────────────────────────────────┘
```

### 7.2 Preview Panel

Before downloading, the user can preview the generated files in a tabbed code viewer. One tab per platform, syntax-highlighted.

### 7.3 Responsive Design

Mobile-friendly. On small screens, the platform sidebar collapses to a horizontal chip selector.

---

## 8. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router) + React 19 | França's primary stack; SSR for SEO on landing |
| Styling | Tailwind CSS v4 + shadcn/ui | Rapid, consistent UI |
| State | React Hook Form + Zod | Form management with schema validation |
| Code preview | Monaco Editor or CodeMirror 6 | Syntax-highlighted preview of generated files |
| ZIP generation | JSZip (client-side) | No server round-trip needed for file generation |
| Hosting | Vercel (Hobby → Pro) | Existing deployment pipeline |
| Analytics | Vercel Analytics or Plausible | Privacy-respecting |
| i18n | next-intl | PT-BR / EN switching |
| Repository | `github.com/orrevua/agentizr` | Public, open-source |

### 8.1 Architecture Decision: Client-Side Generation

All file generation happens **in the browser**. The form collects data, the generator functions compile platform-specific files, JSZip bundles them, and the browser triggers a download. No backend API is needed for MVP.

Benefits:
- Zero server cost for generation
- Works offline after initial page load
- No data leaves the browser (privacy)
- Simpler deployment (static export possible)

### 8.2 Future: API Mode

Post-MVP, add an API endpoint (`/api/generate`) that accepts the `AgentDefinition` JSON and returns a `.zip`. This enables:
- CLI tool (`npx agentizr init`)
- CI/CD integration
- Programmatic agent generation

---

## 9. Project Structure

```
agentizr/
├── public/
│   ├── favicon.ico              # Lightning bolt icon
│   └── og-image.png             # Social share image
│
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with i18n provider
│   │   ├── page.tsx             # Landing / main form page
│   │   ├── [locale]/
│   │   │   └── page.tsx         # Localized routes
│   │   └── api/
│   │       └── generate/
│   │           └── route.ts     # Future: API endpoint
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── form/
│   │   │   ├── AgentForm.tsx            # Main form component
│   │   │   ├── PlatformSelector.tsx     # Checkbox grid
│   │   │   ├── InstructionsEditor.tsx   # Markdown editor for instructions
│   │   │   ├── ToolsPicker.tsx          # Tag input for tools
│   │   │   ├── GlobsInput.tsx           # Glob pattern input
│   │   │   └── ScopeSelector.tsx        # Project vs Global radio
│   │   ├── preview/
│   │   │   ├── PreviewPanel.tsx         # Tabbed code viewer
│   │   │   └── FileTree.tsx             # Visual directory tree
│   │   └── layout/
│   │       ├── Header.tsx               # Logo + language toggle
│   │       └── Footer.tsx
│   │
│   ├── lib/
│   │   ├── schema.ts                    # Zod schema for AgentDefinition
│   │   ├── generator/
│   │   │   ├── index.ts                 # Orchestrator: takes AgentDefinition → FileMap
│   │   │   ├── claude.ts                # Claude Code file generator
│   │   │   ├── copilot.ts              # GitHub Copilot file generator
│   │   │   ├── codex.ts                # OpenAI Codex file generator
│   │   │   ├── gemini.ts               # Gemini CLI file generator
│   │   │   ├── cursor.ts               # Cursor file generator
│   │   │   ├── windsurf.ts             # Windsurf file generator
│   │   │   ├── agents-md.ts            # Universal AGENTS.md generator
│   │   │   ├── readme.ts               # Output README generator
│   │   │   └── types.ts                # FileMap, GeneratedFile types
│   │   ├── templates/
│   │   │   ├── en/                      # English templates
│   │   │   │   ├── agent-body.md        # Default instruction templates
│   │   │   │   ├── readme.md            # README template
│   │   │   │   └── root-context.md      # CLAUDE.md / AGENTS.md template
│   │   │   └── pt-br/                   # Portuguese templates
│   │   │       ├── agent-body.md
│   │   │       ├── readme.md
│   │   │       └── root-context.md
│   │   ├── zip.ts                       # JSZip wrapper
│   │   └── i18n.ts                      # Internationalization config
│   │
│   └── styles/
│       └── globals.css
│
├── messages/
│   ├── en.json                  # UI strings in English
│   └── pt-br.json               # UI strings in Portuguese
│
├── CLAUDE.md                    # Dogfooding: Agentizr's own agent config
├── .github/
│   └── agents/
│       └── agentizr-dev.agent.md
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 10. Generator Module — Detailed Pseudocode

Each platform generator is a pure function:

```typescript
// src/lib/generator/types.ts
interface GeneratedFile {
  path: string;       // Relative path in output zip
  content: string;    // File content
  platform: Platform;
}

type FileMap = GeneratedFile[];

// src/lib/generator/index.ts
function generate(def: AgentDefinition): FileMap {
  const files: FileMap = [];
  
  for (const platform of def.targetPlatforms) {
    switch (platform) {
      case 'claude-code':
        files.push(...generateClaude(def));
        break;
      case 'copilot':
        files.push(...generateCopilot(def));
        break;
      case 'codex':
        files.push(...generateCodex(def));
        break;
      case 'gemini':
        files.push(...generateGemini(def));
        break;
      case 'cursor':
        files.push(...generateCursor(def));
        break;
      case 'windsurf':
        files.push(...generateWindsurf(def));
        break;
    }
  }
  
  // Always generate universal AGENTS.md
  files.push(...generateAgentsMd(def));
  
  // Generate output README
  files.push(generateReadme(def, files));
  
  return files;
}
```

### 10.1 Claude Generator Example

```typescript
// src/lib/generator/claude.ts
function generateClaude(def: AgentDefinition): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const basePath = def.scope === 'global' 
    ? '~/.claude/agents' 
    : '.claude/agents';

  // Build frontmatter
  const fm: Record<string, unknown> = {
    name: def.name,
    description: def.description,
  };
  
  if (def.tools.length > 0) {
    fm.tools = def.tools.join(', '); // Claude uses comma-separated string
  }
  
  fm.model = def.model || 'inherit';
  
  if (def.memory !== 'none') {
    fm.memory = def.memory;
  }

  const content = [
    '---',
    serializeYaml(fm),
    '---',
    '',
    def.instructions,
  ].join('\n');

  files.push({
    path: `${basePath}/${def.slug}.md`,
    content,
    platform: 'claude-code',
  });

  return files;
}
```

---

## 11. Validation Rules

The Zod schema must enforce:

| Field | Rule |
|---|---|
| `name` | Required, 2–80 chars |
| `slug` | Auto-derived, kebab-case, `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `description` | Required, 5–300 chars |
| `instructions` | Required, 10–50,000 chars |
| `tools` | Optional, array of strings |
| `mcpServers` | Optional, array of strings |
| `applyToGlobs` | Optional, valid glob patterns |
| `activationMode` | One of `always`, `auto`, `on_demand`, `manual` |
| `model` | Optional, string |
| `reasoningEffort` | One of `low`, `medium`, `high` |
| `scope` | One of `project`, `global` |
| `memory` | One of `project`, `user`, `local`, `none` |
| `targetPlatforms` | At least one selected |
| `outputLanguage` | One of `en`, `pt-br` |

### 11.1 Platform-Specific Warnings

The UI should show warnings when:

- **Copilot selected + instructions > 6,000 chars** → "Copilot has a 6,000-character limit per instruction file. Your instructions will be truncated."
- **Cursor selected + activationMode=always + instructions > 200 words** → "Cursor recommends ≤ 200 words for always-apply rules to save context tokens."
- **Codex selected + tools provided** → "Codex maps tools to `mcp_servers`. Ensure these MCP servers are configured in your Codex environment."
- **Global scope selected** → "Global agents are installed to your home directory. They won't be tracked in version control."

---

## 12. Presets / Templates

To help users get started fast, offer pre-built agent templates:

| Preset | Description | Default tools |
|---|---|---|
| **Code Reviewer** | Reviews PRs for quality, patterns, and bugs | Read, Grep, Glob |
| **Security Auditor** | OWASP-focused vulnerability scanner | Read, Grep, Bash |
| **Documentation Writer** | Generates/updates docs from code | Read, Grep, Write |
| **Test Generator** | Creates unit/integration tests | Read, Write, Bash |
| **Refactoring Assistant** | Suggests and applies refactoring patterns | Read, Write, Grep |
| **DevOps Agent** | Handles CI/CD, Docker, deployment | Bash, Read, Write |
| **Architecture Planner** | Analyzes codebase and suggests architecture | Read, Grep, Glob |
| **API Designer** | Designs REST/GraphQL API endpoints | Read, Write |

Each preset populates the form fields but remains fully editable.

---

## 13. i18n Strategy

### 13.1 UI Strings
All interface labels, placeholders, tooltips, and validation messages live in `messages/{locale}.json` and are loaded by `next-intl`.

### 13.2 Generated Content
The Markdown body, comments in generated files, and the output README use templates from `src/lib/templates/{locale}/`.

### 13.3 Locale Detection
- Default: browser language
- Override: toggle button in header (PT | EN)
- Persisted in localStorage

---

## 14. SEO & Landing Page

The root page doubles as the landing page and the tool itself (single-page app pattern like Spring Initializr).

- **Title**: "Agentizr — Scaffold AI Coding Agents for Every Platform"
- **Description**: "Define your AI agent once. Get ready-to-use configuration files for Claude Code, GitHub Copilot, OpenAI Codex, Gemini CLI, Cursor, and Windsurf."
- **OG Image**: Logo with lightning bolt Z
- **Keywords**: AI agent scaffolder, Claude Code agent, Copilot agent, Codex agent, CLAUDE.md generator, AGENTS.md generator

---

## 15. Task Breakdown for Implementation

### Phase 1 — Foundation (MVP)
1. **Project setup** — Next.js 15, Tailwind, shadcn/ui, next-intl, JSZip
2. **Data model** — Zod schema for `AgentDefinition`
3. **Generator core** — `generate()` orchestrator + `types.ts`
4. **Claude Code generator** — `claude.ts` (agents + rules + skills)
5. **Copilot generator** — `copilot.ts` (agents + instructions)
6. **Codex generator** — `codex.ts` (TOML agents + config registry)
7. **Gemini generator** — `gemini.ts` (agents + GEMINI.md)
8. **Cursor generator** — `cursor.ts` (.mdc rules)
9. **Windsurf generator** — `windsurf.ts` (rules)
10. **AGENTS.md generator** — `agents-md.ts` (universal fallback)
11. **README generator** — `readme.ts` (explains the output)
12. **ZIP bundler** — `zip.ts` (JSZip wrapper + download trigger)

### Phase 2 — UI
13. **AgentForm** — Main form with React Hook Form + Zod resolver
14. **PlatformSelector** — Checkbox grid with platform logos
15. **InstructionsEditor** — Textarea with Markdown preview
16. **ToolsPicker** — Tag input with autocomplete
17. **GlobsInput** — Multi-input for glob patterns
18. **PreviewPanel** — Tabbed code viewer with syntax highlighting
19. **FileTree** — Visual directory tree component
20. **Header + Footer + Layout** — Branding, language toggle

### Phase 3 — Polish
21. **Presets** — Template system with pre-built agent configs
22. **i18n** — PT-BR translations for all UI strings and templates
23. **Validation warnings** — Platform-specific limit warnings
24. **Responsive design** — Mobile-optimized layout
25. **Accessibility** — ARIA labels, keyboard nav, focus management

### Phase 4 — Post-MVP
26. **API endpoint** — `/api/generate` for programmatic access
27. **CLI wrapper** — `npx agentizr init` (separate package)
28. **Multi-agent** — Generate multiple agents in a single session
29. **Import** — Upload existing agent files and edit them
30. **Community presets** — User-submitted agent templates

---

## 16. Testing Strategy

| Layer | Tool | Coverage target |
|---|---|---|
| Generator functions | Vitest | 100% — pure functions, easy to test |
| Zod schema | Vitest | Edge cases for all validation rules |
| Components | React Testing Library | Form interaction, preview rendering |
| E2E | Playwright | Full flow: fill form → preview → download zip → verify contents |
| i18n | Snapshot tests | Ensure all keys exist in both locales |

### 16.1 Generator Test Example

```typescript
describe('generateClaude', () => {
  it('generates correct frontmatter with comma-separated tools', () => {
    const def = makeAgent({ tools: ['Bash', 'Read', 'Grep'] });
    const files = generateClaude(def);
    const content = files[0].content;
    expect(content).toContain('tools: "Bash, Read, Grep"');
  });

  it('uses inherit as default model', () => {
    const def = makeAgent({ model: '' });
    const files = generateClaude(def);
    expect(files[0].content).toContain('model: inherit');
  });
});
```

---

## 17. Dogfooding

Agentizr's own repository will use the agent configurations it generates:

- `CLAUDE.md` — Root context for Claude Code development
- `.github/agents/agentizr-dev.agent.md` — Copilot agent for the project
- `.claude/agents/agentizr-dev.md` — Claude Code subagent
- `AGENTS.md` — Universal fallback

This serves as both documentation and a live test of the generator output.

---

## 18. Success Metrics

| Metric | Target (3 months post-launch) |
|---|---|
| Unique visitors | 1,000/month |
| ZIP downloads | 500/month |
| GitHub stars | 100 |
| Supported platforms | 6 (all listed above) |
| Community presets submitted | 10 |

---

## 19. Open Questions

1. **Skill generation depth** — Should Agentizr generate full skill directories with placeholder scripts, or just `SKILL.md`?
2. **Live playground** — Should the preview panel be a full Monaco editor where users can edit generated files before download?
3. **Authentication** — Is there value in user accounts for saving/sharing agent configs, or keep it stateless?
4. **Monetization** — Freemium with premium presets? Sponsorware? Fully free/open-source?

---

*End of specification. This document is the single source of truth for Agentizr development. All task decomposition, implementation, and testing should reference this spec.*
