/* eslint-disable react-func/max-lines-per-function */
import { describe, expect, it } from 'vitest';

import {
  clampWidgetRepeatCount,
  getPlaybackBounds,
  shouldTrackActiveWords,
} from './widgetAudioPlayback';

import ThemeType from '@/redux/types/ThemeType';
import type { WidgetOptions } from '@/types/Embed';

const makeOptions = (overrides: Partial<WidgetOptions> = {}): WidgetOptions => ({
  enableAudio: true,
  enableWbw: false,
  enableWbwTransliteration: false,
  theme: ThemeType.Light,
  mushaf: 'qpc',
  showTranslatorNames: false,
  showArabic: true,
  showTafsirs: true,
  showReflections: true,
  showLessons: true,
  showAnswers: true,
  locale: 'en',
  labels: {
    quran: 'Quran',
    readOnQuran: 'Read on Quran.com',
    surah: 'Surah',
    verse: 'Verse',
    tafsirs: 'Tafsirs',
    reflections: 'Reflections',
    lessons: 'Lessons',
    answers: 'Answers',
  },
  ayah: '2:1',
  hasAnyTranslations: false,
  hasAnswers: false,
  isClarificationQuestion: false,
  ...overrides,
});

describe('widgetAudioPlayback', () => {
  it('prefers valid segment millisecond bounds over legacy seconds bounds', () => {
    const bounds = getPlaybackBounds(
      undefined,
      makeOptions({
        audioStart: 10,
        audioEnd: 20,
        audioSegment: {
          segmentType: 'CUSTOM',
          surahId: 2,
          ayahStart: 1,
          ayahEnd: 1,
          startTimeMs: 1000,
          endTimeMs: 2400,
        },
      }),
    );

    expect(bounds).toEqual({
      startSeconds: 1,
      endSeconds: 2.4,
      source: 'segment',
      segmentType: 'CUSTOM',
    });
  });

  it('uses legacy second bounds when segment bounds are missing', () => {
    const bounds = getPlaybackBounds(undefined, makeOptions({ audioStart: 3, audioEnd: 9 }));

    expect(bounds).toEqual({
      startSeconds: 3,
      endSeconds: 9,
      source: 'legacy',
    });
  });

  it('falls back safely when segment bounds are invalid', () => {
    const bounds = getPlaybackBounds(
      undefined,
      makeOptions({
        audioStart: 3,
        audioEnd: 9,
        audioSegment: {
          segmentType: 'CUSTOM',
          surahId: 2,
          ayahStart: 1,
          ayahEnd: 1,
          startTimeMs: 2400,
          endTimeMs: 1000,
        },
      }),
    );

    expect(bounds).toEqual({
      startSeconds: 3,
      endSeconds: 9,
      source: 'legacy',
    });
  });

  it('drops invalid legacy end bounds instead of returning end <= start', () => {
    const bounds = getPlaybackBounds(undefined, makeOptions({ audioStart: 9, audioEnd: 3 }));

    expect(bounds).toEqual({
      startSeconds: 9,
      endSeconds: undefined,
      source: 'legacy',
    });
  });

  it('clamps repeat count to 1 through 20', () => {
    expect(clampWidgetRepeatCount(undefined)).toBe(1);
    expect(clampWidgetRepeatCount(0)).toBe(1);
    expect(clampWidgetRepeatCount(3)).toBe(3);
    expect(clampWidgetRepeatCount(20.9)).toBe(20);
    expect(clampWidgetRepeatCount(999)).toBe(20);
  });

  it('tracks active words only when highlighting is enabled and timestamps exist', () => {
    expect(shouldTrackActiveWords(makeOptions())).toBe(false);
    expect(
      shouldTrackActiveWords(
        makeOptions({
          enableWordHighlight: true,
          wordTimestamps: [
            {
              surahId: 2,
              ayahNumber: 1,
              wordIndex: 0,
              startTimeMs: 1000,
              endTimeMs: 1400,
            },
          ],
        }),
      ),
    ).toBe(true);
  });
});
