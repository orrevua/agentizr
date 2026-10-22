import { describe, expect, it } from 'vitest';
import en from '../../../messages/en.json';
import ptBr from '../../../messages/pt-br.json';

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null
      ? flatten(v as Record<string, unknown>, key)
      : [key];
  });
}

describe('i18n parity', () => {
  it('en and pt-br expose identical key sets', () => {
    const enKeys = flatten(en).sort();
    const ptKeys = flatten(ptBr).sort();
    expect(ptKeys).toEqual(enKeys);
  });
});
