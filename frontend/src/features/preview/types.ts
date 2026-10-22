import type { Platform } from '@/features/workspace-builder/types';

export type FileLanguage = 'markdown' | 'toml' | 'yaml' | 'text';
export type PlatformOrUniversal = Platform | 'universal';

export interface GeneratedFile {
  path: string;
  content: string;
  platform: PlatformOrUniversal;
  language: FileLanguage;
}

export interface GenerationWarning {
  code: string;
  message: string;
  platform?: Platform | null;
}

export interface GenerationResult {
  files: GeneratedFile[];
  warnings: GenerationWarning[];
}
