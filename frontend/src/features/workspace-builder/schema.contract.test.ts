import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  agentDefinitionSchema,
  skillDefinitionSchema,
  workflowEdgeSchema,
  workflowNodeSchema,
  workspaceSchema,
} from './schema';

const FIXTURE = path.resolve(__dirname, '../../test/fixtures/openapi.json');

function backendProps(openapi: Record<string, unknown>, name: string): string[] {
  const schemas = (openapi as { components: { schemas: Record<string, { properties: object }> } })
    .components.schemas;
  return Object.keys(schemas[name].properties);
}

describe.skipIf(!fs.existsSync(FIXTURE))('schema contract (OpenAPI ↔ Zod)', () => {
  const openapi = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8'));

  it('AgentDefinition matches', () => {
    const backend = backendProps(openapi, 'AgentDefinition');
    const zod = Object.keys(agentDefinitionSchema.shape);
    expect(backend.sort()).toEqual(zod.sort());
  });

  it('SkillDefinition matches', () => {
    const backend = backendProps(openapi, 'SkillDefinition');
    const zod = Object.keys(skillDefinitionSchema.shape);
    expect(backend.sort()).toEqual(zod.sort());
  });

  it('WorkflowNode matches', () => {
    const backend = backendProps(openapi, 'WorkflowNode');
    const zod = Object.keys(workflowNodeSchema.shape);
    expect(backend.sort()).toEqual(zod.sort());
  });

  it('WorkflowEdge matches', () => {
    const backend = backendProps(openapi, 'WorkflowEdge');
    const zod = Object.keys(workflowEdgeSchema.shape);
    expect(backend.sort()).toEqual(zod.sort());
  });

  it('WorkspaceDefinition matches', () => {
    const backend = backendProps(openapi, 'WorkspaceDefinition');
    const inner = (workspaceSchema as unknown as { _def: { schema: { shape: object } } })._def
      .schema.shape;
    const zod = Object.keys(inner);
    expect(backend.sort()).toEqual(zod.sort());
  });
});
