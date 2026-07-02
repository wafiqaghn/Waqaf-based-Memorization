// src/xstate/actors/boundaryCycle/computeTolerance.ts

export type BoundaryPoint = {
  id: string;
  timestampFrom: number;
  timestampTo: number;
  label?: string;
};

/**
 * Returns how many ms before `timestampTo` we should trigger a boundary end.
 *
 * Design intent:
 *  - Short chunks need a tighter window — a 500ms chunk with 200ms tolerance
 *    fires at 60% through, cutting the syllable.
 *  - Long chunks (Alafasy breath trails) need more slack.
 *  - The early-reject threshold prevents triggers during or immediately after
 *    a seek when timeupdate fires with a stale / jumped timestamp.
 */
export function computeTolerance(boundary: BoundaryPoint): number {
  const duration = boundary.timestampTo - boundary.timestampFrom;

  // Extremely short chunk — minimum safe window
  if (duration < 800) return 60;

  // Short chunk
  if (duration < 1500) return 120;

  // Normal range — linear interpolation between 150ms and 260ms
  if (duration <= 8000) {
    const ratio = (duration - 1500) / 6500;
    return Math.round(150 + ratio * 110);
  }

  // Long chunk / full ayah with extended recitation
  return 300;
}

/**
 * Returns true if the timestamp is too early to plausibly be at the
 * boundary end. This guards against timeupdate events arriving with
 * old/jumped timestamps immediately after a seek.
 *
 * Rule: must have played at least 500ms past the boundary start before
 * we will consider the boundary ended.
 */
export function isTooEarlyInBoundary(
  currentTimestamp: number,
  boundary: BoundaryPoint,
): boolean {
  return currentTimestamp < boundary.timestampFrom + 500;
}
