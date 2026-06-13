import type { WidgetWaqafMarker } from '@/types/Embed';
import type Word from 'types/Word';

import { GENERATED_AL_BAQARAH_WAQAF_MARKS } from './waqafMarks.alBaqarah.generated';

export type WaqafMarkerSource = 'manual' | 'generated' | 'auto';

export type WaqafSymbolMetadata = {
  type: string;
  description: string;
  priorWeight: number;
};

export const WAQAF_SYMBOL_METADATA: Record<string, WaqafSymbolMetadata> = {
  'ۖ': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۚ': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۗ': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۛ': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۘ': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۙ': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۜ': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۢ': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۭ': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  '۞': {
    type: 'pause-sign',
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
};

const WAQAF_SYMBOL_PRIORITY: string[] = ['ۖ', 'ۚ', 'ۗ', 'ۛ', 'ۘ', 'ۙ', 'ۜ', 'ۢ', 'ۭ', '۞'];
const WAQAF_SYMBOLS: Set<string> = new Set(WAQAF_SYMBOL_PRIORITY);

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
  source?: WaqafMarkerSource;
};

export const MANUAL_WAQAF_MARKS_HAFS: readonly WaqafMark[] = [
  {
    chapterNumber: 2,
    verseNumber: 2,
    wordIndex: 5,
    symbol: 'ج',
    type: 'permissible-stop',
    description: 'MVP sample marker for testing waqaf segment playback near a phrase boundary.',
    priorWeight: 0.6,
    source: 'manual',
  },
  {
    chapterNumber: 2,
    verseNumber: 3,
    wordIndex: 4,
    symbol: 'ج',
    type: 'permissible-stop',
    description: 'MVP sample marker for Al-Baqarah audio segment validation.',
    priorWeight: 0.6,
    source: 'manual',
  },
  {
    chapterNumber: 2,
    verseNumber: 4,
    wordIndex: 6,
    symbol: 'ج',
    type: 'permissible-stop',
    description: 'MVP sample marker for Al-Baqarah audio segment validation.',
    priorWeight: 0.6,
    source: 'manual',
  },
  {
    chapterNumber: 2,
    verseNumber: 5,
    wordIndex: 5,
    symbol: 'م',
    type: 'necessary-stop',
    description: 'MVP sample marker for Al-Baqarah audio segment validation.',
    priorWeight: 0.7,
    source: 'manual',
  },
  {
    chapterNumber: 2,
    verseNumber: 20,
    wordIndex: 8,
    symbol: 'ج',
    type: 'permissible-stop',
    description: 'MVP sample marker for Al-Baqarah 1-20 prototype checks.',
    priorWeight: 0.6,
    source: 'manual',
  },
];

export const WAQAF_MARKS_HAFS: readonly WaqafMark[] = [
  ...MANUAL_WAQAF_MARKS_HAFS,
  ...GENERATED_AL_BAQARAH_WAQAF_MARKS,
];

const getWordTextFields = (word: Word): string[] =>
  [
    word.qpcUthmaniHafs,
    word.textUthmani,
    word.text,
    word.textIndopak,
    word.textUthmaniTajweed,
    word.text_uthmani,
    word.qpc_uthmani_hafs,
    word.text_uthmani_tajweed,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

export const extractWaqafSymbolFromWord = (word: Word): string | undefined => {
  const textFields = getWordTextFields(word);
  return WAQAF_SYMBOL_PRIORITY.find((symbol) =>
    textFields.some((textField) => textField.includes(symbol)),
  );
};

const getWordIndexFromWord = (word: Word, fallbackIndex: number): number => {
  if (Number.isInteger(word.position) && word.position > 0) return word.position - 1;

  const locationSegment = word.location?.split(':')[2];
  const locationPosition = Number(locationSegment);
  if (Number.isInteger(locationPosition) && locationPosition > 0) return locationPosition - 1;

  return fallbackIndex;
};

const isVerseEndWord = (word: Word): boolean => word.charTypeName === 'end';

export const extractWaqafMarkersFromVerseWords = ({
  chapterNumber,
  verseNumber,
  words = [],
}: {
  chapterNumber: number;
  verseNumber: number;
  words?: Word[];
}): WidgetWaqafMarker[] => {
  const markers: WidgetWaqafMarker[] = [];
  const quranWords = words.filter((word) => !isVerseEndWord(word));

  quranWords.forEach((word, index) => {
    if (index === quranWords.length - 1) return;

    const wordIndex = getWordIndexFromWord(word, index);
    const symbol = extractWaqafSymbolFromWord(word);
    if (!symbol || !WAQAF_SYMBOLS.has(symbol)) return;

    const metadata = WAQAF_SYMBOL_METADATA[symbol];
    markers.push({
      surahId: chapterNumber,
      ayahNumber: verseNumber,
      wordIndex,
      symbol,
      type: metadata.type,
      description: metadata.description,
      priorWeight: metadata.priorWeight,
      source: 'auto',
    });
  });

  return markers.sort((a, b) => a.wordIndex - b.wordIndex);
};

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
    source: mark.source,
  }));

const markerKey = (marker: WidgetWaqafMarker): string =>
  `${marker.surahId}:${marker.ayahNumber}:${marker.wordIndex}:${marker.symbol}`;

const MARKER_SOURCE_PRIORITY: Record<WaqafMarkerSource, number> = {
  manual: 0,
  generated: 1,
  auto: 2,
};

const dedupeMarkers = (markers: WidgetWaqafMarker[]): WidgetWaqafMarker[] => {
  const seen = new Set<string>();
  const deduped: WidgetWaqafMarker[] = [];

  markers.forEach((marker) => {
    const key = markerKey(marker);
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(marker);
  });

  return deduped.sort((a, b) => {
    const aSourcePriority = MARKER_SOURCE_PRIORITY[a.source ?? 'generated'];
    const bSourcePriority = MARKER_SOURCE_PRIORITY[b.source ?? 'generated'];
    if (aSourcePriority !== bSourcePriority) return aSourcePriority - bSourcePriority;
    return a.wordIndex - b.wordIndex;
  });
};

export const getResolvedWidgetWaqafMarkersForAyah = ({
  chapterNumber,
  verseNumber,
  words,
}: {
  chapterNumber: number;
  verseNumber: number;
  words?: Word[];
}): WidgetWaqafMarker[] =>
  dedupeMarkers([
    ...getWidgetWaqafMarkersForAyah(chapterNumber, verseNumber),
    ...extractWaqafMarkersFromVerseWords({ chapterNumber, verseNumber, words }),
  ]);
