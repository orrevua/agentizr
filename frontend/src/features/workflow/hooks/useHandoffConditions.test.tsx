import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../../messages/en.json';
import { useHandoffConditions } from './useHandoffConditions';

function Probe() {
  const { data } = useHandoffConditions();
  return (
    <ul>
      {data.map((c) => (
        <li key={c.id}>{c.label}</li>
      ))}
    </ul>
  );
}

describe('useHandoffConditions', () => {
  it('returns conditions with locale-resolved labels', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="en" messages={en}>
          <Probe />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText('Task complete')).toBeInTheDocument());
    expect(screen.getByText('Needs review')).toBeInTheDocument();
  });
});
