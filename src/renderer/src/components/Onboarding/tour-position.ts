export interface TourRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}
export function tourPosition(
  rect: TourRect | null,
  width: number,
  height: number,
  panelHeight: number,
): { left: number; top: number; width: number; side: string } {
  const size = Math.min(360, width - 32),
    maxTop = Math.max(56, height - panelHeight - 16);
  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), Math.max(min, max));
  if (
    rect &&
    rect.right > 0 &&
    rect.left < width &&
    rect.bottom > 44 &&
    rect.top < height
  ) {
    if (rect.right + size + 24 <= width - 16)
      return {
        left: rect.right + 24,
        top: clamp(rect.top, 56, maxTop),
        width: size,
        side: 'right',
      };
    if (rect.left - size - 24 >= 16)
      return {
        left: rect.left - size - 24,
        top: clamp(rect.top, 56, maxTop),
        width: size,
        side: 'left',
      };
    if (rect.bottom + panelHeight + 24 < height - 16)
      return {
        left: clamp(rect.left, 16, width - size - 16),
        top: rect.bottom + 24,
        width: size,
        side: 'bottom',
      };
    if (rect.top - panelHeight - 24 > 56)
      return {
        left: clamp(rect.left, 16, width - size - 16),
        top: rect.top - panelHeight - 24,
        width: size,
        side: 'top',
      };
  }
  return {
    left: Math.max(16, width - size - 16),
    top: maxTop,
    width: size,
    side: 'floating',
  };
}
