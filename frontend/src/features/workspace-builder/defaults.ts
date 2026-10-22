import type { AgentDefinitionInput, SkillDefinitionInput, WorkspaceDefinitionInput } from './schema';

export function makeEmptyAgent(): AgentDefinitionInput {
  return {
    name: '',
    slug: '',
    description: '',
    instructions: '',
    tools: [],
    mcpServers: [],
    applyToGlobs: [],
    activationMode: 'auto',
    model: 'inherit',
    reasoningEffort: 'medium',
    scope: 'project',
    memory: 'project',
    targetPlatforms: ['claude-code'],
  };
}

export function makeEmptySkill(): SkillDefinitionInput {
  return {
    name: '',
    slug: '',
    description: '',
    instructions: '',
    platforms: ['claude-code'],
    scope: 'project',
    scaffoldDirs: false,
  };
}

export function makeEmptyWorkspace(): WorkspaceDefinitionInput {
  return {
    agents: [makeEmptyAgent()],
    skills: [],
    workflow: { nodes: [], edges: [] },
    outputLanguage: 'en',
  };
}

