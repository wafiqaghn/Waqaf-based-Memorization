import type { WidgetWaqafMarker } from '@/types/Embed';

/**
 * MVP/sample waqaf marker metadata for Al-Baqarah only.
 *
 * These marks are helper segmentation priors for timestamp-based playback. They are not a verified
 * canonical waqaf source and must not be treated as measured audio boundary accuracy.
 *
 * `wordIndex` is 1-based here to match QuranCDN timing segment word locations and the main reader
 * boundary-cycle helpers. Widget-facing helpers convert this value to zero-based indexes.
 */
export type WaqafMark = {
  chapterNumber: number;
  verseNumber: number;
  wordIndex: number;
  symbol: string;
  type: string;
  description?: string;
  priorWeight?: number;
};

export const WAQAF_MARKS_HAFS: readonly WaqafMark[] = [
  {
    chapterNumber: 2,
    verseNumber: 2,
    wordIndex: 5,
    symbol: 'ج',
    type: 'permissible-stop',
    description: 'MVP sample marker for testing waqaf segment playback near a phrase boundary.',
    priorWeight: 0.6,
  },
  {
    chapterNumber: 2,
    verseNumber: 5,
    wordIndex: 5,
    symbol: 'م',
    type: 'necessary-stop',
    description: 'MVP sample marker for Al-Baqarah audio segment validation.',
    priorWeight: 0.7,
  },
  {
    chapterNumber: 2,
    verseNumber: 20,
    wordIndex: 8,
    symbol: 'ج',
    type: 'permissible-stop',
    description: 'MVP sample marker for Al-Baqarah 1-20 prototype checks.',
    priorWeight: 0.6,
  },
];

export const getWaqafMarksForVerse = (
  allWaqafMarks: readonly WaqafMark[],
  chapterNumber: number,
  verseNumber: number,
): WaqafMark[] =>
  allWaqafMarks.filter(
    (mark) => mark.chapterNumber === chapterNumber && mark.verseNumber === verseNumber,
  );

export const getWidgetWaqafMarkersForAyah = (
  surahId: number,
  ayahNumber: number,
): WidgetWaqafMarker[] =>
  getWaqafMarksForVerse(WAQAF_MARKS_HAFS, surahId, ayahNumber).map((mark) => ({
    surahId: mark.chapterNumber,
    ayahNumber: mark.verseNumber,
    wordIndex: mark.wordIndex - 1,
    symbol: mark.symbol,
    type: mark.type,
    description: mark.description,
    priorWeight: mark.priorWeight,
  }));
