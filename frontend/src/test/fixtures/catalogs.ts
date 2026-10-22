export const TOOLS_FIXTURE = {
  tools: [
    { name: 'Read', description: 'Read files from disk', platforms: ['claude-code', 'cursor'] },
    { name: 'Grep', description: 'Search file contents', platforms: ['claude-code'] },
    { name: 'Bash', description: 'Execute shell commands', platforms: ['claude-code'] },
  ],
};

export const MODELS_FIXTURE = {
  models: [
    { id: 'claude-sonnet-4', label: 'Claude Sonnet 4', platforms: ['claude-code'] },
    { id: 'gpt-5', label: 'GPT-5', platforms: ['codex'] },
  ],
};

export const MCP_FIXTURE = {
  mcpServers: [
    { name: 'filesystem', description: 'Local FS access', platforms: ['claude-code'] },
  ],
};

export const PRESETS_FIXTURE = {
  presets: [
    {
      id: 'security-auditor',
      label: 'Security Auditor',
      description: 'OWASP-focused vulnerability scanner',
      definition: {
        tools: ['Read', 'Grep', 'Bash'],
        activationMode: 'on_demand',
        scope: 'project',
        instructions: 'You are a security auditor. Scan for OWASP Top 10.',
      },
    },
  ],
};

export const HANDOFF_CONDITIONS_FIXTURE = {
  conditions: [
    { id: 'task_complete', labelEn: 'Task complete', labelPtBr: 'Tarefa concluída' },
    { id: 'needs_review', labelEn: 'Needs review', labelPtBr: 'Precisa revisão' },
    { id: 'error_escalation', labelEn: 'Error escalation', labelPtBr: 'Escalação de erro' },
    { id: 'out_of_scope', labelEn: 'Out of scope', labelPtBr: 'Fora de escopo' },
  ],
};

export const PREVIEW_FIXTURE = {
  files: [
    {
      path: 'claude-code/.claude/agents/test.md',
      content: '---\nname: Test\n---\n\nbody',
      platform: 'claude-code',
      language: 'markdown',
    },
  ],
  warnings: [],
};
