import type { WidgetWaqafMarker } from '@/types/Embed';
import type Word from 'types/Word';

import { GENERATED_AL_BAQARAH_WAQAF_MARKS } from './waqafMarks.alBaqarah.generated';

export type WaqafMarkerSource = 'manual' | 'generated' | 'auto' | 'auto-runtime';
export type WaqafDecision =
  | 'stop-preferred'
  | 'stop-allowed'
  | 'continue-preferred'
  | 'stop-prohibited';
export type WaqafIgnoreReason =
  | 'STOP_PROHIBITED_SIGN'
  | 'CONTINUE_PREFERRED_SIGN'
  | 'AMBIGUOUS_TEXTUAL_SIGN'
  | 'NO_DEFAULT_CUT_CANDIDATE';

export type WaqafSymbolMetadata = {
  type: string;
  decision: WaqafDecision;
  defaultCutCandidate: boolean;
  priority: number;
  description: string;
  priorWeight: number;
};

export const WAQAF_SYMBOL_METADATA: Record<string, WaqafSymbolMetadata> = {
  'ۖ': {
    type: 'pause-sign',
    decision: 'stop-allowed',
    defaultCutCandidate: true,
    priority: 60,
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۚ': {
    type: 'pause-sign',
    decision: 'stop-allowed',
    defaultCutCandidate: true,
    priority: 60,
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۗ': {
    type: 'pause-sign',
    decision: 'stop-allowed',
    defaultCutCandidate: true,
    priority: 60,
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۛ': {
    type: 'pause-sign',
    decision: 'stop-allowed',
    defaultCutCandidate: true,
    priority: 60,
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۘ': {
    type: 'pause-sign',
    decision: 'stop-allowed',
    defaultCutCandidate: true,
    priority: 60,
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۙ': {
    type: 'pause-sign',
    decision: 'stop-allowed',
    defaultCutCandidate: true,
    priority: 60,
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  'ۜ': {
    type: 'pause-sign',
    decision: 'stop-allowed',
    defaultCutCandidate: true,
    priority: 60,
    description: 'Auto-detected MVP waqaf marker from Quran text',
    priorWeight: 0.6,
  },
  ط: {
    type: 'waqaf-mutlaq',
    decision: 'stop-preferred',
    defaultCutCandidate: true,
    priority: 90,
    description: 'Waqaf Mutlaq: stopping is preferred',
    priorWeight: 0.9,
  },
  لا: {
    type: 'waqaf-mamnu',
    decision: 'stop-prohibited',
    defaultCutCandidate: false,
    priority: 0,
    description: 'Waqaf Mamnu: stopping is prohibited',
    priorWeight: 0,
  },
  صلى: {
    type: 'al-washlu-aula',
    decision: 'continue-preferred',
    defaultCutCandidate: false,
    priority: 10,
    description: 'Al-Washlu Aula: continuing is preferred',
    priorWeight: 0.1,
  },
};

export const WAQAF_PAUSE_SIGNS: readonly string[] = ['ۖ', 'ۚ', 'ۗ', 'ۘ', 'ۙ', 'ۛ', 'ۜ'];
const TEXTUAL_WAQAF_SIGNS: readonly string[] = ['لا', 'ط', 'صلى'];

export type IgnoredWaqafSign = {
  symbol: string;
  codePoints: string[];
  wordIndex: number;
  wordText: string;
  decision?: WaqafDecision;
  defaultCutCandidate?: boolean;
  priority?: number;
  source: WaqafMarkerSource;
  reason: WaqafIgnoreReason;
};

export type WaqafExtractionResult = {
  markers: WidgetWaqafMarker[];
  ignoredSigns: IgnoredWaqafSign[];
};

export type WordTextFieldDebugInfo = {
  position?: number;
  charTypeName?: string;
  textFields: {
    field: string;
    value: string;
    codePoints: ReturnType<typeof toCodePoints>;
    detectedWaqafSymbols: string[];
  }[];
};

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
  decision?: WaqafDecision;
  defaultCutCandidate?: boolean;
  priority?: number;
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

const WORD_TEXT_FIELD_NAMES = [
  'qpcUthmaniHafs',
  'textUthmani',
  'text',
  'textIndopak',
  'textUthmaniTajweed',
  'text_uthmani',
  'qpc_uthmani_hafs',
  'text_uthmani_tajweed',
] as const;

type WordTextFieldName = (typeof WORD_TEXT_FIELD_NAMES)[number];

const getWordTextFieldEntries = (word: Word): { field: WordTextFieldName; value: string }[] =>
  WORD_TEXT_FIELD_NAMES.map((field) => ({ field, value: word[field] })).filter(
    (entry): entry is { field: WordTextFieldName; value: string } =>
      typeof entry.value === 'string' && entry.value.length > 0,
  );

const getWordTextFields = (word: Word): string[] =>
  getWordTextFieldEntries(word).map((entry) => entry.value);

const getPrimaryWordText = (word: Word): string =>
  getWordTextFields(word)[0] ?? word.location ?? '';

export const extractWaqafSymbolFromWord = (word: Word): string | undefined => {
  const textFields = getWordTextFields(word);
  return WAQAF_PAUSE_SIGNS.find((symbol) =>
    textFields.some((textField) => textField.includes(symbol)),
  );
};

export const extractWaqafSymbols = (text: string): string[] =>
  WAQAF_PAUSE_SIGNS.filter((symbol) => text.includes(symbol));

export const toCodePoints = (
  text: string,
): {
  char: string;
  codePoint: string;
}[] =>
  Array.from(text).map((char) => ({
    char,
    codePoint: `U+${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`,
  }));

const getCodePointLabels = (text: string): string[] =>
  toCodePoints(text).map((item) => item.codePoint);

export const debugWordTextFields = (words: Word[] = []): WordTextFieldDebugInfo[] =>
  words.map((word) => ({
    position: word.position,
    charTypeName: word.charTypeName ?? word.char_type_name,
    textFields: getWordTextFieldEntries(word).map(({ field, value }) => ({
      field,
      value,
      codePoints: toCodePoints(value),
      detectedWaqafSymbols: extractWaqafSymbols(value),
    })),
  }));

const getWordIndexFromWord = (word: Word, fallbackIndex: number): number => {
  if (Number.isInteger(word.position) && word.position > 0) return word.position - 1;

  const locationSegment = word.location?.split(':')[2];
  const locationPosition = Number(locationSegment);
  if (Number.isInteger(locationPosition) && locationPosition > 0) return locationPosition - 1;

  return fallbackIndex;
};

const getCharTypeName = (word: Word): string | undefined => word.charTypeName ?? word.char_type_name;

const isVerseEndWord = (word: Word): boolean => getCharTypeName(word) === 'end';
const isAnnotationWord = (word: Word): boolean => getCharTypeName(word) === 'pause';

const normalizeAnnotationText = (value: string): string =>
  value.replace(/<[^>]+>/g, '').replace(/\s|\u200C/g, '');

const extractSafeTextualAnnotation = (word: Word): string | undefined => {
  if (!isAnnotationWord(word)) return undefined;
  const normalizedFields = getWordTextFields(word).map(normalizeAnnotationText);
  return TEXTUAL_WAQAF_SIGNS.find((symbol) =>
    normalizedFields.some((textField) => textField === symbol),
  );
};

const getIgnoreReason = (metadata?: WaqafSymbolMetadata): WaqafIgnoreReason => {
  if (metadata?.decision === 'stop-prohibited') return 'STOP_PROHIBITED_SIGN';
  if (metadata?.decision === 'continue-preferred') return 'CONTINUE_PREFERRED_SIGN';
  return 'NO_DEFAULT_CUT_CANDIDATE';
};

const buildMarker = ({
  chapterNumber,
  verseNumber,
  wordIndex,
  symbol,
  source,
}: {
  chapterNumber: number;
  verseNumber: number;
  wordIndex: number;
  symbol: string;
  source: WaqafMarkerSource;
}): WidgetWaqafMarker | undefined => {
  const metadata = WAQAF_SYMBOL_METADATA[symbol];
  if (!metadata?.defaultCutCandidate) return undefined;

  return {
    surahId: chapterNumber,
    ayahNumber: verseNumber,
    wordIndex,
    symbol,
    type: metadata.type,
    decision: metadata.decision,
    defaultCutCandidate: metadata.defaultCutCandidate,
    priority: metadata.priority,
    description: metadata.description,
    priorWeight: metadata.priorWeight,
    source,
  };
};

export const extractWaqafSignsFromVerseWords = ({
  chapterNumber,
  verseNumber,
  words = [],
}: {
  chapterNumber: number;
  verseNumber: number;
  words?: Word[];
}): WaqafExtractionResult => {
  const markers: WidgetWaqafMarker[] = [];
  const ignoredSigns: IgnoredWaqafSign[] = [];
  const quranWords = words.filter((word) => !isVerseEndWord(word));

  quranWords.forEach((word, index) => {
    if (index === quranWords.length - 1 && !isAnnotationWord(word)) return;

    const safeTextualSymbol = extractSafeTextualAnnotation(word);
    const wordIndex = safeTextualSymbol
      ? Math.max(0, index - 1)
      : getWordIndexFromWord(word, index);
    const symbol = safeTextualSymbol ?? extractWaqafSymbolFromWord(word);
    if (!symbol) return;

    const marker = buildMarker({
      chapterNumber,
      verseNumber,
      wordIndex,
      symbol,
      source: 'auto-runtime',
    });
    if (marker) {
      markers.push(marker);
      return;
    }

    const metadata = WAQAF_SYMBOL_METADATA[symbol];
    ignoredSigns.push({
      symbol,
      codePoints: getCodePointLabels(symbol),
      wordIndex,
      wordText: getPrimaryWordText(word),
      decision: metadata?.decision,
      defaultCutCandidate: metadata?.defaultCutCandidate,
      priority: metadata?.priority,
      source: 'auto-runtime',
      reason: getIgnoreReason(metadata),
    });
  });

  return {
    markers: markers.sort((a, b) => a.wordIndex - b.wordIndex),
    ignoredSigns,
  };
};

export const extractWaqafMarkersFromVerseWords = (params: {
  chapterNumber: number;
  verseNumber: number;
  words?: Word[];
}): WidgetWaqafMarker[] => extractWaqafSignsFromVerseWords(params).markers;

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
    decision: mark.decision,
    defaultCutCandidate: mark.defaultCutCandidate,
    priority: mark.priority,
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
  'auto-runtime': 2,
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
