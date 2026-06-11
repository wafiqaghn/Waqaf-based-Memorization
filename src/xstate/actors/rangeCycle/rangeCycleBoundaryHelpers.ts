import {
  buildAyahBoundary,
  buildWaqafBoundaries,
  verseTimingToBoundaryInput,
} from '../boundaryCycle/buildWaqafBoundaries';
import { BoundaryPoint } from '../boundaryCycle/computeTolerance';

import { WAQAF_MARKS_HAFS } from '@/data/waqafMarks';
import VerseTiming from 'types/VerseTiming';

import type { RepeatMode } from '../repeatMachine/types';

export type ReciterWaqafConfig = {
  waqafBreathOffset?: number;
};

export const buildBoundariesForVerse = (
  verseTiming: VerseTiming,
  repeatMode: RepeatMode,
  reciterConfig: ReciterWaqafConfig = {},
): BoundaryPoint[] => {
  const input = verseTimingToBoundaryInput(verseTiming);

  if (repeatMode === 'waqaf') {
    return buildWaqafBoundaries(input, WAQAF_MARKS_HAFS, {
      reciterBreathOffset: reciterConfig.waqafBreathOffset ?? 0,
    });
  }

  return buildAyahBoundary(input);
};
