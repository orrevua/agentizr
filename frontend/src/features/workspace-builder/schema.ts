import { z } from 'zod';

export const PLATFORMS = [
  'claude-code',
  'copilot',
  'codex',
  'gemini',
  'cursor',
  'windsurf',
] as const;

export const SKILL_PLATFORMS = ['claude-code', 'gemini'] as const;

export const ACTIVATION_MODES = ['always', 'auto', 'on_demand', 'manual'] as const;
export const SCOPES = ['project', 'global'] as const;
export const MEMORIES = ['project', 'user', 'local', 'none'] as const;
export const REASONING_EFFORTS = ['low', 'medium', 'high'] as const;
export const OUTPUT_LANGUAGES = ['en', 'pt-br'] as const;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const agentDefinitionSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().regex(SLUG_RE, 'Lowercase letters, numbers, and dashes only'),
  description: z.string().min(5).max(300),
  instructions: z.string().min(10).max(50_000),

  tools: z.array(z.string()),
  mcpServers: z.array(z.string()),

  applyToGlobs: z.array(z.string()),
  activationMode: z.enum(ACTIVATION_MODES),

  model: z.string(),
  reasoningEffort: z.enum(REASONING_EFFORTS),

  scope: z.enum(SCOPES),
  memory: z.enum(MEMORIES),

  targetPlatforms: z.array(z.enum(PLATFORMS)).min(1, 'Select at least one platform'),
});

export const skillDefinitionSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().regex(SLUG_RE, 'Lowercase letters, numbers, and dashes only'),
  description: z.string().min(5).max(300),
  instructions: z.string().min(10).max(50_000),
  platforms: z.array(z.enum(SKILL_PLATFORMS)).min(1, 'Select at least one platform'),
  scope: z.enum(SCOPES),
  scaffoldDirs: z.boolean(),
});

export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const workflowNodeSchema = z.object({
  id: z.string().regex(SLUG_RE),
  position: positionSchema,
});

export const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().regex(SLUG_RE),
  target: z.string().regex(SLUG_RE),
  label: z.string().max(120).nullable().optional(),
  condition: z.string().max(200).nullable().optional(),
});

export const workflowSchema = z.object({
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
});

export const workspaceSchema = z
  .object({
    agents: z.array(agentDefinitionSchema).min(1).max(10),
    skills: z.array(skillDefinitionSchema),
    workflow: workflowSchema,
    outputLanguage: z.enum(OUTPUT_LANGUAGES),
  })
  .superRefine((ws, ctx) => {
    const slugs = new Set<string>();
    for (const a of ws.agents) {
      if (slugs.has(a.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['agents'],
          message: `Duplicate slug "${a.slug}"`,
        });
      }
      slugs.add(a.slug);
    }
    for (const s of ws.skills) {
      if (slugs.has(s.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['skills'],
          message: `Duplicate slug "${s.slug}"`,
        });
      }
      slugs.add(s.slug);
    }
    const agentSlugs = new Set(ws.agents.map((a) => a.slug));
    ws.workflow.nodes.forEach((n, i) => {
      if (!agentSlugs.has(n.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['workflow', 'nodes', i, 'id'],
          message: `Unknown agent "${n.id}"`,
        });
      }
    });
    ws.workflow.edges.forEach((e, i) => {
      if (!agentSlugs.has(e.source)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['workflow', 'edges', i, 'source'],
          message: `Unknown agent "${e.source}"`,
        });
      }
      if (!agentSlugs.has(e.target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['workflow', 'edges', i, 'target'],
          message: `Unknown agent "${e.target}"`,
        });
      }
    });
  });

export type AgentDefinitionInput = z.input<typeof agentDefinitionSchema>;
export type AgentDefinition = z.output<typeof agentDefinitionSchema>;
export type SkillDefinitionInput = z.input<typeof skillDefinitionSchema>;
export type SkillDefinition = z.output<typeof skillDefinitionSchema>;
export type WorkflowNode = z.output<typeof workflowNodeSchema>;
export type WorkflowEdge = z.output<typeof workflowEdgeSchema>;
export type Workflow = z.output<typeof workflowSchema>;
export type WorkspaceDefinitionInput = z.input<typeof workspaceSchema>;
export type WorkspaceDefinition = z.output<typeof workspaceSchema>;

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
