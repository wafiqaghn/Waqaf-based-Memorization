import type { WidgetAudioSegment, WidgetOptions } from '@/types/Embed';

export type PlaybackBoundsSource = 'segment' | 'legacy';

export type PlaybackBounds = {
  startSeconds: number;
  endSeconds?: number;
  source: PlaybackBoundsSource;
  segmentType?: WidgetAudioSegment['segmentType'];
};

export const MIN_WIDGET_REPEAT_COUNT = 1;
export const MAX_WIDGET_REPEAT_COUNT = 20;

const MS_PER_SECOND = 1000;

const parseFiniteNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const isValidBoundRange = (startSeconds: number | undefined, endSeconds: number | undefined) =>
  startSeconds !== undefined && endSeconds !== undefined && endSeconds > startSeconds;

/**
 * Clamp widget repeat counts defensively for runtime playback.
 *
 * @param {number | undefined} repeatCount - Requested repeat count.
 * @returns {number} Safe repeat count in [1..20].
 */
export const clampWidgetRepeatCount = (repeatCount?: number): number => {
  if (!Number.isFinite(repeatCount)) return MIN_WIDGET_REPEAT_COUNT;
  return Math.min(
    MAX_WIDGET_REPEAT_COUNT,
    Math.max(MIN_WIDGET_REPEAT_COUNT, Math.trunc(Number(repeatCount))),
  );
};

/**
 * Resolve playback bounds for the widget audio element.
 *
 * Timestamp-based audioSegment metadata wins when valid. Legacy seconds-based
 * data attributes/options are kept as the fallback path for existing widgets.
 *
 * @param {HTMLAudioElement | undefined} audioElement - Widget audio element.
 * @param {WidgetOptions} options - Widget options.
 * @returns {PlaybackBounds} Resolved playback bounds.
 */
export const getPlaybackBounds = (
  audioElement: HTMLAudioElement | undefined,
  options: WidgetOptions,
): PlaybackBounds => {
  const segment = options.audioSegment;
  const segmentStartSeconds =
    segment?.startTimeMs !== undefined ? segment.startTimeMs / MS_PER_SECOND : undefined;
  const segmentEndSeconds =
    segment?.endTimeMs !== undefined ? segment.endTimeMs / MS_PER_SECOND : undefined;

  if (isValidBoundRange(segmentStartSeconds, segmentEndSeconds)) {
    return {
      startSeconds: Number(segmentStartSeconds),
      endSeconds: Number(segmentEndSeconds),
      source: 'segment',
      segmentType: segment?.segmentType,
    };
  }

  const legacyStartSeconds =
    parseFiniteNumber(audioElement?.dataset.audioStart) ?? options.audioStart ?? 0;
  const legacyEndSeconds = parseFiniteNumber(audioElement?.dataset.audioEnd) ?? options.audioEnd;

  return {
    startSeconds: legacyStartSeconds,
    endSeconds: isValidBoundRange(legacyStartSeconds, legacyEndSeconds)
      ? legacyEndSeconds
      : undefined,
    source: 'legacy',
  };
};

/**
 * Whether runtime word highlighting should attempt active-word updates.
 *
 * @param {WidgetOptions} options - Widget options.
 * @returns {boolean} Whether highlighting can run.
 */
export const shouldTrackActiveWords = (options: WidgetOptions): boolean =>
  Boolean(options.enableWordHighlight && options.wordTimestamps?.length);
