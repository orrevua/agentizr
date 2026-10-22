import type {
  ACTIVATION_MODES,
  MEMORIES,
  OUTPUT_LANGUAGES,
  PLATFORMS,
  REASONING_EFFORTS,
  SCOPES,
  SKILL_PLATFORMS,
} from './schema';

export type Platform = (typeof PLATFORMS)[number];
export type SkillPlatform = (typeof SKILL_PLATFORMS)[number];
export type ActivationMode = (typeof ACTIVATION_MODES)[number];
export type Scope = (typeof SCOPES)[number];
export type Memory = (typeof MEMORIES)[number];
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];
export type OutputLanguage = (typeof OUTPUT_LANGUAGES)[number];

export interface CatalogSubtool {
  name: string;
  description: string;
}

export interface CatalogToolItem {
  name: string;
  description: string;
  platforms: Platform[];
  subtools?: CatalogSubtool[];
}

export interface CatalogModelItem {
  id: string;
  label: string;
  platforms: Platform[];
}

export interface CatalogMcpItem {
  name: string;
  description: string;
  platforms: Platform[];
}

export interface CatalogPresetItem {
  id: string;
  label: string;
  description: string;
  definition: Record<string, unknown>;
}
