import { describe, expect, it } from 'vitest';
import { agentDefinitionSchema, slugify, workspaceSchema } from './schema';
import { makeEmptyWorkspace } from './defaults';

const VALID_AGENT = {
  name: 'Security Reviewer',
  slug: 'security-reviewer',
  description: 'Reviews code for vulnerabilities',
  instructions: 'You are a security expert. Always check for SQL injection.',
  tools: [],
  mcpServers: [],
  applyToGlobs: [],
  activationMode: 'auto',
  model: 'inherit',
  reasoningEffort: 'medium',
  scope: 'project',
  memory: 'project',
  targetPlatforms: ['claude-code'],
} as const;

describe('agentDefinitionSchema', () => {
  it('accepts a fully valid payload', () => {
    expect(agentDefinitionSchema.safeParse(VALID_AGENT).success).toBe(true);
  });

  it('rejects names shorter than 2 chars', () => {
    expect(agentDefinitionSchema.safeParse({ ...VALID_AGENT, name: 'a' }).success).toBe(false);
  });

  it('rejects an invalid slug', () => {
    expect(agentDefinitionSchema.safeParse({ ...VALID_AGENT, slug: 'Bad Slug' }).success).toBe(false);
  });

  it('rejects instructions shorter than 10 chars', () => {
    expect(agentDefinitionSchema.safeParse({ ...VALID_AGENT, instructions: 'short' }).success).toBe(false);
  });

  it('rejects empty target platforms', () => {
    expect(agentDefinitionSchema.safeParse({ ...VALID_AGENT, targetPlatforms: [] }).success).toBe(false);
  });

  it('rejects unknown activation mode', () => {
    expect(
      agentDefinitionSchema.safeParse({ ...VALID_AGENT, activationMode: 'whenever' }).success,
    ).toBe(false);
  });

  it('rejects descriptions over 300 chars', () => {
    expect(
      agentDefinitionSchema.safeParse({ ...VALID_AGENT, description: 'x'.repeat(301) }).success,
    ).toBe(false);
  });
});

describe('workspaceSchema', () => {
  const validWorkspace = {
    agents: [VALID_AGENT],
    skills: [],
    workflow: { nodes: [], edges: [] },
    outputLanguage: 'en',
  } as const;

  it('accepts a valid workspace', () => {
    expect(workspaceSchema.safeParse(validWorkspace).success).toBe(true);
  });

  it('rejects more than 10 agents', () => {
    const agents = Array.from({ length: 11 }, (_, i) => ({
      ...VALID_AGENT,
      slug: `agent-${i}`,
    }));
    expect(workspaceSchema.safeParse({ ...validWorkspace, agents }).success).toBe(false);
  });

  it('rejects duplicate slugs across agents and skills', () => {
    const ws = {
      ...validWorkspace,
      skills: [
        {
          name: 'Same',
          slug: 'security-reviewer',
          description: 'desc desc',
          instructions: 'instructions long enough',
          platforms: ['claude-code'],
          scope: 'project',
          scaffoldDirs: false,
        },
      ],
    } as const;
    expect(workspaceSchema.safeParse(ws).success).toBe(false);
  });

  it('rejects edges referencing unknown agents', () => {
    const ws = {
      ...validWorkspace,
      workflow: {
        nodes: [],
        edges: [{ id: 'e1', source: 'unknown', target: 'security-reviewer' }],
      },
    } as const;
    expect(workspaceSchema.safeParse(ws).success).toBe(false);
  });
});

describe('makeEmptyWorkspace', () => {
  it('returns a workspace shape that only fails on required user inputs', () => {
    const ws = makeEmptyWorkspace();
    const result = workspaceSchema.safeParse(ws);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths.some((p) => p.startsWith('agents.0.name'))).toBe(true);
    }
  });
});

describe('slugify', () => {
  it('lowercases and dashifies', () => {
    expect(slugify('Security Reviewer')).toBe('security-reviewer');
  });

  it('collapses non-alphanumerics', () => {
    expect(slugify('  Foo  --  Bar!! ')).toBe('foo-bar');
  });

  it('returns empty string for non-alphanumeric input', () => {
    expect(slugify('!!!')).toBe('');
  });
});
