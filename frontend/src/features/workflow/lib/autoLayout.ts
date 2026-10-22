export function autoLayout(index: number): { x: number; y: number } {
  return {
    x: 80 + (index % 4) * 240,
    y: 80 + Math.floor(index / 4) * 180,
  };
}
