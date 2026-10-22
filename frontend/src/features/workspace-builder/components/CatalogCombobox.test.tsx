import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../../messages/en.json';
import { CatalogCombobox, type CatalogComboboxItem } from './CatalogCombobox';

const ITEMS: CatalogComboboxItem[] = [
  { name: 'Read', description: 'Read files' },
  { name: 'Grep', description: 'Search content' },
];

function setup(value: string[], onChange = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CatalogCombobox
        items={ITEMS}
        value={value}
        onChange={onChange}
        placeholder="Select"
        emptyLabel="None"
      />
    </NextIntlClientProvider>,
  );
  return { onChange };
}

describe('CatalogCombobox', () => {
  it('renders a badge for each selected item', () => {
    setup(['Read']);
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('removes a selected item when X button clicked', () => {
    const { onChange } = setup(['Read', 'Grep']);
    fireEvent.click(screen.getByLabelText('Remove Read'));
    expect(onChange).toHaveBeenCalledWith(['Grep']);
  });
});
