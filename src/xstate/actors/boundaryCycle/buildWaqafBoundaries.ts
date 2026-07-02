// src/xstate/actors/boundaryCycle/buildWaqafBoundaries.ts

import { BoundaryPoint } from './computeTolerance';
import { WaqafMark, getWaqafMarksForVerse, WAQAF_MARKS_HAFS } from '@/data/waqafMarks';
import VerseTiming from 'types/VerseTiming';
import { getChapterNumberFromKey, getVerseNumberFromKey } from '@/utils/verse';

/**
 * A single verse worth of timing data as provided by your existing
 * VerseTiming model. Only the fields we need are referenced here —
 * the rest of the shape is preserved by the parent caller.
 */
export type VerseTimingForBoundary = {
  chapterNumber: number;
  verseNumber: number;
  timestampFrom: number;
  timestampTo: number;
  /**
   * Each element: [wordLocation, timestampFrom, timestampTo]
   * wordLocation is 1-indexed word position within the verse.
   */
  segments: [number, number, number][];
};

export type BuildWaqafBoundariesOptions = {
  /**
   * Per-reciter offset in ms added to each waqaf boundary timestampTo.
   * Alafasy typically has ~80-120ms of breath tail after waqaf points.
   * Set via reciter config, not hardcoded here.
   */
  reciterBreathOffset?: number;
};

/**
 * Maps API VerseTiming (verseKey-based) to VerseTimingForBoundary.
 */
export const verseTimingToBoundaryInput = (verseTiming: VerseTiming): VerseTimingForBoundary => ({
  chapterNumber: Number(getChapterNumberFromKey(verseTiming.verseKey)),
  verseNumber: Number(getVerseNumberFromKey(verseTiming.verseKey)),
  timestampFrom: verseTiming.timestampFrom,
  timestampTo: verseTiming.timestampTo,
  segments: verseTiming.segments as [number, number, number][],
});

/**
 * Builds an ordered list of BoundaryPoints from verse timing segments
 * and static waqaf mark data.
 *
 * For ayah mode, call buildAyahBoundary() instead — it produces the
 * single-element array that boundaryCycleMachine expects.
 */
export function buildWaqafBoundaries(
  verseTiming: VerseTimingForBoundary,
  allWaqafMarks: readonly WaqafMark[] = WAQAF_MARKS_HAFS,
  options: BuildWaqafBoundariesOptions = {},
): BoundaryPoint[] {
  const { reciterBreathOffset = 0 } = options;

  const marks = getWaqafMarksForVerse(
    allWaqafMarks,
    verseTiming.chapterNumber,
    verseTiming.verseNumber,
  );

  // No waqaf marks for this verse — treat it as a single ayah boundary.
  // This is safe: boundaryCycleMachine handles a 1-element array identically
  // to the old verseCycleMachine behavior.
  if (marks.length === 0) {
    return buildAyahBoundary(verseTiming);
  }

  const boundaries: BoundaryPoint[] = [];
  let chunkStart = verseTiming.timestampFrom;

  for (const mark of marks) {
    const segment = verseTiming.segments.find(([wordLoc]) => wordLoc === mark.wordIndex);

    if (!segment) {
      // Data quality issue: waqaf mark references a word with no timing.
      // Log and skip — do not create a boundary with undefined timestamps.
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(
          `[buildWaqafBoundaries] No segment found for waqaf mark at ` +
            `${mark.chapterNumber}:${mark.verseNumber} word ${mark.wordIndex}. ` +
            `Skipping this mark.`,
        );
      }
      continue;
    }

    const [, , segmentEnd] = segment;
    const boundaryEnd = segmentEnd + reciterBreathOffset;

    // Guard: if chunkStart >= boundaryEnd, this chunk has zero or negative
    // duration (can happen with overlapping segments). Skip it.
    if (chunkStart >= boundaryEnd) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(
          `[buildWaqafBoundaries] Zero-duration chunk at ` +
            `${mark.chapterNumber}:${mark.verseNumber} word ${mark.wordIndex}. ` +
            `chunkStart=${chunkStart}, segmentEnd=${segmentEnd}. Skipping.`,
        );
      }
      continue;
    }

    boundaries.push({
      id: `${mark.chapterNumber}:${mark.verseNumber}:w${mark.wordIndex}`,
      timestampFrom: chunkStart,
      timestampTo: boundaryEnd,
      label: mark.type,
    });

    // Next chunk begins immediately after this one.
    // Use Math.max to handle the case where the segment end is actually
    // before chunkStart (malformed data), preventing a backward seek.
    chunkStart = Math.max(boundaryEnd, chunkStart);
  }

  // Final chunk: from the last waqaf point to the verse end.
  // Only add if there's meaningful duration remaining (> 200ms).
  const remainingDuration = verseTiming.timestampTo - chunkStart;
  if (remainingDuration > 200) {
    boundaries.push({
      id: `${verseTiming.chapterNumber}:${verseTiming.verseNumber}:tail`,
      timestampFrom: chunkStart,
      timestampTo: verseTiming.timestampTo,
      label: undefined,
    });
  }

  // If we ended up with no boundaries (all marks had missing segments),
  // fall back to full ayah boundary.
  if (boundaries.length === 0) {
    return buildAyahBoundary(verseTiming);
  }

  return boundaries;
}

/**
 * Produces the single-element BoundaryPoint array used in ayah mode.
 * This is the exact equivalent of the old verseCycleMachine's
 * timestampFrom / timestampTo pair.
 */
export function buildAyahBoundary(
  verseTiming: Pick<
    VerseTimingForBoundary,
    'chapterNumber' | 'verseNumber' | 'timestampFrom' | 'timestampTo'
  >,
): BoundaryPoint[] {
  return [
    {
      id: `${verseTiming.chapterNumber}:${verseTiming.verseNumber}:ayah`,
      timestampFrom: verseTiming.timestampFrom,
      timestampTo: verseTiming.timestampTo,
      label: 'ayah',
    },
  ];
}
