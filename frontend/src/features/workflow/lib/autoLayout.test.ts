import { describe, expect, it } from 'vitest';
import { autoLayout } from './autoLayout';

describe('autoLayout', () => {
  it('places the first node at the top-left of the grid', () => {
    expect(autoLayout(0)).toEqual({ x: 80, y: 80 });
  });

  it('advances along the x axis for the next 3 indices', () => {
    expect(autoLayout(3)).toEqual({ x: 80 + 3 * 240, y: 80 });
  });

  it('wraps to the next row after 4 entries', () => {
    expect(autoLayout(4)).toEqual({ x: 80, y: 80 + 180 });
    expect(autoLayout(5)).toEqual({ x: 80 + 240, y: 80 + 180 });
  });
});
