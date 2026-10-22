import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../../messages/en.json';
import { WarningsBanner } from './WarningsBanner';
import type { GenerationWarning } from '../types';

function wrap(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {node}
    </NextIntlClientProvider>
  );
}

describe('WarningsBanner', () => {
  it('renders nothing when warnings is empty', () => {
    const { container } = render(wrap(<WarningsBanner warnings={[]} />));
    expect(container.firstChild).toBeNull();
  });

  it('renders each warning code and message', () => {
    const warnings: GenerationWarning[] = [
      { code: 'copilot_char_limit', message: 'Copilot truncates over 6000 chars.', platform: 'copilot' },
      { code: 'global_scope_untracked', message: 'Global agents are not tracked.' },
    ];
    render(wrap(<WarningsBanner warnings={warnings} />));
    expect(screen.getByText('copilot_char_limit')).toBeInTheDocument();
    expect(screen.getByText(/Copilot truncates/)).toBeInTheDocument();
    expect(screen.getByText('global_scope_untracked')).toBeInTheDocument();
  });
});
