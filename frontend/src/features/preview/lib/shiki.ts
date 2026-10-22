'use client';

import type { BundledLanguage, Highlighter } from 'shiki';
import type { FileLanguage } from '../types';

const LANG_MAP: Record<FileLanguage, BundledLanguage> = {
  markdown: 'markdown',
  toml: 'toml',
  yaml: 'yaml',
  text: 'plaintext' as BundledLanguage,
};

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-light'],
        langs: ['markdown', 'toml', 'yaml'],
      }),
    );
  }
  return highlighterPromise;
}

export async function highlight(code: string, language: FileLanguage): Promise<string> {
  const hl = await getHighlighter();
  return hl.codeToHtml(code, { lang: LANG_MAP[language], theme: 'github-light' });
}
