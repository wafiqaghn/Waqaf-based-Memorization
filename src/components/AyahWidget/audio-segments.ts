/* eslint-disable max-lines */
import type {
  WidgetAudioMode,
  WidgetAudioSegment,
  WidgetWaqafMarker,
  WidgetWordTimestamp,
} from '@/types/Embed';
import type { QuranCDNSegment } from 'types/Segment';

type ConvertQuranCDNSegmentsParams = {
  surahId: number;
  ayahNumber: number;
  segments?: QuranCDNSegment[];
};

type ResolveAyahSegmentParams = {
  audioUrl?: string;
  surahId: number;
  ayahStart: number;
  ayahEnd: number;
  audioStart?: number;
  audioEnd?: number;
};

type ResolveCustomSegmentParams = {
  audioUrl?: string;
  surahId: number;
  ayahStart: number;
  ayahEnd: number;
  startWordIndex?: number;
  endWordIndex?: number;
  wordTimestamps?: WidgetWordTimestamp[];
};

type ResolveWaqafSegmentParams = {
  audioUrl?: string;
  surahId: number;
  ayahStart: number;
  ayahEnd: number;
  waqafIndex?: number;
  wordTimestamps?: WidgetWordTimestamp[];
  waqafMarkers?: WidgetWaqafMarker[];
};

type ResolveWidgetSegmentParams = ResolveAyahSegmentParams &
  ResolveCustomSegmentParams &
  ResolveWaqafSegmentParams & {
    audioMode?: WidgetAudioMode;
  };

export type WaqafSegmentFallbackReason =
  | 'INVALID_WAQAF_INDEX'
  | 'MARKER_NOT_FOUND'
  | 'INVALID_WORD_INDEX'
  | 'TIMESTAMP_NOT_FOUND'
  | 'END_CLAMP_INVALID'
  | 'NO_INTERNAL_WAQAF_SIGN';

export type WaqafSegmentResolutionDebugInfo = {
  markerCount: number;
  selectedMarker?: WidgetWaqafMarker;
  selectedSymbol?: string;
  markerSource?: WidgetWaqafMarker['source'];
  selectedWordIndex?: number;
  matchedTimestamp?: WidgetWordTimestamp;
  nextWordTimestamp?: WidgetWordTimestamp;
  computedStartTimeMs?: number;
  computedEndTimeMs?: number;
  fallbackReason?: WaqafSegmentFallbackReason;
  segment?: WidgetAudioSegment;
};

type WordRange = {
  startWordIndex: number;
  endWordIndex: number;
};

const MS_PER_SECOND = 1000;
export const WAQAF_END_PADDING_MS = 300;

const isValidTimeRange = (startTimeMs?: number, endTimeMs?: number): boolean =>
  Number.isFinite(startTimeMs) &&
  Number.isFinite(endTimeMs) &&
  Number(endTimeMs) > Number(startTimeMs);

const getAyahTimestamps = (
  wordTimestamps: WidgetWordTimestamp[] | undefined,
  ayahNumber: number,
): WidgetWordTimestamp[] =>
  (wordTimestamps ?? [])
    .filter((timestamp) => timestamp.ayahNumber === ayahNumber)
    .sort((a, b) => a.wordIndex - b.wordIndex);

const findWordTimestamp = (
  wordTimestamps: WidgetWordTimestamp[] | undefined,
  ayahNumber: number,
  wordIndex: number,
): WidgetWordTimestamp | undefined =>
  wordTimestamps?.find(
    (timestamp) => timestamp.ayahNumber === ayahNumber && timestamp.wordIndex === wordIndex,
  );

const findNextWordTimestamp = (
  wordTimestamps: WidgetWordTimestamp[] | undefined,
  ayahNumber: number,
  wordIndex: number,
): WidgetWordTimestamp | undefined =>
  getAyahTimestamps(wordTimestamps, ayahNumber).find(
    (timestamp) => timestamp.wordIndex > wordIndex,
  );

/**
 * Convert QuranCDN word timing tuples into widget timestamps.
 *
 * QuranCDN word locations are 1-based. Widget query params and internal word indexes are 0-based,
 * so this is the one conversion boundary for the embed widget.
 *
 * @param {ConvertQuranCDNSegmentsParams} params - Conversion params.
 * @returns {WidgetWordTimestamp[]} Widget timestamp records.
 */
export const convertQuranCDNSegmentsToWordTimestamps = ({
  surahId,
  ayahNumber,
  segments = [],
}: ConvertQuranCDNSegmentsParams): WidgetWordTimestamp[] => {
  const timestamps: WidgetWordTimestamp[] = [];

  segments.forEach((segment) => {
    const [quranCdnWordIndex, startTimeMs, endTimeMs] = segment;
    if (!isValidTimeRange(startTimeMs, endTimeMs)) return;

    const wordIndex = quranCdnWordIndex - 1;
    if (!Number.isInteger(wordIndex) || wordIndex < 0) return;

    timestamps.push({
      surahId,
      ayahNumber,
      wordIndex,
      startTimeMs,
      endTimeMs,
      source: 'QURAN_CDN',
    });
  });

  return timestamps;
};

/**
 * Validate and clamp a word range against available timestamps.
 *
 * @param {WidgetWordTimestamp[]} wordTimestamps - Timestamps for one ayah.
 * @param {number | undefined} startWordIndex - Requested start word index.
 * @param {number | undefined} endWordIndex - Requested end word index.
 * @returns {WordRange | undefined} Clamped range or undefined if invalid.
 */
export const validateWordRange = (
  wordTimestamps: WidgetWordTimestamp[],
  startWordIndex?: number,
  endWordIndex?: number,
): WordRange | undefined => {
  if (!wordTimestamps.length) return undefined;
  if (!Number.isInteger(startWordIndex) || !Number.isInteger(endWordIndex)) return undefined;

  const sorted = [...wordTimestamps].sort((a, b) => a.wordIndex - b.wordIndex);
  const minWordIndex = sorted[0].wordIndex;
  const maxWordIndex = sorted[sorted.length - 1].wordIndex;
  const start = Math.max(minWordIndex, Math.min(Number(startWordIndex), maxWordIndex));
  const end = Math.max(minWordIndex, Math.min(Number(endWordIndex), maxWordIndex));

  if (start > end) return undefined;
  return { startWordIndex: start, endWordIndex: end };
};

/**
 * Resolve an ayah or ayah-range segment from existing audio boundaries.
 *
 * @param {ResolveAyahSegmentParams} params - Resolver params.
 * @returns {WidgetAudioSegment | undefined} Resolved segment metadata.
 */
export const resolveAyahAudioSegment = ({
  audioUrl,
  surahId,
  ayahStart,
  ayahEnd,
  audioStart,
  audioEnd,
}: ResolveAyahSegmentParams): WidgetAudioSegment | undefined => {
  const startTimeMs = audioStart !== undefined ? audioStart * MS_PER_SECOND : undefined;
  const endTimeMs = audioEnd !== undefined ? audioEnd * MS_PER_SECOND : undefined;
  if (!isValidTimeRange(startTimeMs, endTimeMs)) return undefined;

  return {
    audioUrl,
    segmentType: 'AYAH',
    surahId,
    ayahStart,
    ayahEnd,
    startTimeMs: Number(startTimeMs),
    endTimeMs: Number(endTimeMs),
    source: 'QURAN_CDN',
  };
};

/**
 * Resolve a custom word-range segment from word timestamps.
 *
 * @param {ResolveCustomSegmentParams} params - Resolver params.
 * @returns {WidgetAudioSegment | undefined} Resolved segment metadata.
 */
export const resolveCustomAudioSegment = ({
  audioUrl,
  surahId,
  ayahStart,
  ayahEnd,
  startWordIndex,
  endWordIndex,
  wordTimestamps,
}: ResolveCustomSegmentParams): WidgetAudioSegment | undefined => {
  const startAyahTimestamps = getAyahTimestamps(wordTimestamps, ayahStart);
  const endAyahTimestamps = getAyahTimestamps(wordTimestamps, ayahEnd);
  const startRange = validateWordRange(startAyahTimestamps, startWordIndex, startWordIndex);
  const endRange = validateWordRange(endAyahTimestamps, endWordIndex, endWordIndex);

  if (!startRange || !endRange) return undefined;
  if (ayahStart === ayahEnd && startRange.startWordIndex > endRange.endWordIndex) {
    return undefined;
  }

  const startTimestamp = findWordTimestamp(wordTimestamps, ayahStart, startRange.startWordIndex);
  const endTimestamp = findWordTimestamp(wordTimestamps, ayahEnd, endRange.endWordIndex);
  if (!startTimestamp || !endTimestamp) return undefined;
  if (!isValidTimeRange(startTimestamp.startTimeMs, endTimestamp.endTimeMs)) return undefined;

  return {
    audioUrl,
    segmentType: 'CUSTOM',
    surahId,
    ayahStart,
    ayahEnd,
    startWordIndex: startRange.startWordIndex,
    endWordIndex: endRange.endWordIndex,
    startTimeMs: startTimestamp.startTimeMs,
    endTimeMs: endTimestamp.endTimeMs,
    source: 'QURAN_CDN',
  };
};

/**
 * Resolve a waqaf segment with debug metadata for tests and diagnostics.
 *
 * @param {ResolveWaqafSegmentParams} params - Resolver params.
 * @returns {WaqafSegmentResolutionDebugInfo} Resolution details and optional segment.
 */
export const getWaqafSegmentResolutionDebugInfo = ({
  audioUrl,
  surahId,
  ayahStart,
  ayahEnd,
  waqafIndex,
  wordTimestamps,
  waqafMarkers,
}: ResolveWaqafSegmentParams): WaqafSegmentResolutionDebugInfo => {
  const markerCount = waqafMarkers?.length ?? 0;
  if (!Number.isInteger(waqafIndex)) {
    return { markerCount, fallbackReason: 'INVALID_WAQAF_INDEX' };
  }

  const marker = waqafMarkers?.[Number(waqafIndex)];
  if (!marker) {
    return { markerCount, fallbackReason: 'MARKER_NOT_FOUND' };
  }

  if (!Number.isInteger(marker.wordIndex) || marker.wordIndex < 0) {
    return {
      markerCount,
      selectedMarker: marker,
      selectedSymbol: marker.symbol,
      markerSource: marker.source,
      selectedWordIndex: marker.wordIndex,
      fallbackReason: 'INVALID_WORD_INDEX',
    };
  }

  const ayahStartTimestamps = getAyahTimestamps(wordTimestamps, ayahStart);
  const markerAyahTimestamps = getAyahTimestamps(wordTimestamps, marker.ayahNumber);
  const startTimestamp = ayahStartTimestamps[0];
  const endTimestamp = findWordTimestamp(wordTimestamps, marker.ayahNumber, marker.wordIndex);
  const nextWordTimestamp = findNextWordTimestamp(
    wordTimestamps,
    marker.ayahNumber,
    marker.wordIndex,
  );
  const markerAyahEndTimestamp = markerAyahTimestamps[markerAyahTimestamps.length - 1];
  const debugBase: WaqafSegmentResolutionDebugInfo = {
    markerCount,
    selectedMarker: marker,
    selectedSymbol: marker.symbol,
    markerSource: marker.source,
    selectedWordIndex: marker.wordIndex,
    matchedTimestamp: endTimestamp,
    nextWordTimestamp,
    computedStartTimeMs: startTimestamp?.startTimeMs,
  };

  if (!startTimestamp) {
    return { ...debugBase, fallbackReason: 'TIMESTAMP_NOT_FOUND' };
  }
  if (!endTimestamp) {
    return { ...debugBase, fallbackReason: 'TIMESTAMP_NOT_FOUND' };
  }

  const paddedEndTimeMs = endTimestamp.endTimeMs + WAQAF_END_PADDING_MS;
  const endTimeMs = markerAyahEndTimestamp
    ? Math.min(paddedEndTimeMs, markerAyahEndTimestamp.endTimeMs)
    : paddedEndTimeMs;

  if (!isValidTimeRange(startTimestamp.startTimeMs, endTimeMs)) {
    return {
      ...debugBase,
      computedEndTimeMs: endTimeMs,
      fallbackReason: 'END_CLAMP_INVALID',
    };
  }

  const segment: WidgetAudioSegment = {
    audioUrl,
    segmentType: 'WAQAF',
    surahId,
    ayahStart,
    ayahEnd,
    startWordIndex: 0,
    endWordIndex: marker.wordIndex,
    startTimeMs: startTimestamp.startTimeMs,
    endTimeMs,
    source: 'GENERATED',
  };

  return {
    ...debugBase,
    computedEndTimeMs: endTimeMs,
    segment,
  };
};

/**
 * Resolve a waqaf segment from helper marker metadata and word timestamps.
 *
 * @param {ResolveWaqafSegmentParams} params - Resolver params.
 * @returns {WidgetAudioSegment | undefined} Resolved segment metadata.
 */
export const resolveWaqafAudioSegment = (
  params: ResolveWaqafSegmentParams,
): WidgetAudioSegment | undefined => {
  return getWaqafSegmentResolutionDebugInfo(params).segment;
};

/**
 * Resolve the requested widget audio segment mode.
 *
 * @param {ResolveWidgetSegmentParams} params - Resolver params.
 * @returns {WidgetAudioSegment | undefined} Resolved segment metadata.
 */
export const resolveWidgetAudioSegment = (
  params: ResolveWidgetSegmentParams,
): WidgetAudioSegment | undefined => {
  switch (params.audioMode) {
    case 'custom':
      return resolveCustomAudioSegment(params);
    case 'waqaf':
      return resolveWaqafAudioSegment(params);
    case 'ayah':
    default:
      return resolveAyahAudioSegment(params);
  }
};

/**
 * Resolve the active zero-based word index for a current audio time.
 *
 * @param {WidgetWordTimestamp[]} wordTimestamps - Available word timestamps.
 * @param {number} currentTimeMs - Current audio time in milliseconds.
 * @param {number | undefined} ayahNumber - Optional ayah filter.
 * @returns {number | undefined} Active zero-based word index.
 */
export const getActiveWordIndexFromTime = (
  wordTimestamps: WidgetWordTimestamp[],
  currentTimeMs: number,
  ayahNumber?: number,
): number | undefined => {
  const activeTimestamp = wordTimestamps.find((timestamp) => {
    if (ayahNumber !== undefined && timestamp.ayahNumber !== ayahNumber) return false;
    return currentTimeMs >= timestamp.startTimeMs && currentTimeMs < timestamp.endTimeMs;
  });

  return activeTimestamp?.wordIndex;
};
