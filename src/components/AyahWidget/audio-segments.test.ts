/* eslint-disable max-lines */
/* eslint-disable react-func/max-lines-per-function */
import { describe, expect, it } from 'vitest';

import {
  WAQAF_END_PADDING_MS,
  convertQuranCDNSegmentsToWordTimestamps,
  getActiveWordIndexFromTime,
  resolveAyahAudioSegment,
  resolveCustomAudioSegment,
  resolveWaqafAudioSegment,
} from './audio-segments';

import { getWidgetWaqafMarkersForAyah } from '@/data/waqafMarks';
import type { WidgetWaqafMarker, WidgetWordTimestamp } from '@/types/Embed';
import type { QuranCDNSegment } from 'types/Segment';

const wordTimestamps: WidgetWordTimestamp[] = [
  {
    surahId: 2,
    ayahNumber: 1,
    wordIndex: 0,
    startTimeMs: 1000,
    endTimeMs: 1400,
    source: 'QURAN_CDN',
  },
  {
    surahId: 2,
    ayahNumber: 1,
    wordIndex: 1,
    startTimeMs: 1400,
    endTimeMs: 1800,
    source: 'QURAN_CDN',
  },
  {
    surahId: 2,
    ayahNumber: 1,
    wordIndex: 2,
    startTimeMs: 1800,
    endTimeMs: 2400,
    source: 'QURAN_CDN',
  },
];

describe('audio segment resolvers', () => {
  it('converts QuranCDN 1-based segments to zero-based widget word timestamps', () => {
    const segments: QuranCDNSegment[] = [
      [1, 1000, 1400],
      [2, 1400, 1800],
    ];

    expect(
      convertQuranCDNSegmentsToWordTimestamps({
        surahId: 2,
        ayahNumber: 1,
        segments,
      }),
    ).toEqual([
      {
        surahId: 2,
        ayahNumber: 1,
        wordIndex: 0,
        startTimeMs: 1000,
        endTimeMs: 1400,
        source: 'QURAN_CDN',
      },
      {
        surahId: 2,
        ayahNumber: 1,
        wordIndex: 1,
        startTimeMs: 1400,
        endTimeMs: 1800,
        source: 'QURAN_CDN',
      },
    ]);
  });

  it('ignores invalid QuranCDN segments', () => {
    const segments: QuranCDNSegment[] = [
      [1, 1400, 1400],
      [0, 1000, 1400],
      [2, 1400, 1800],
    ];

    const timestamps = convertQuranCDNSegmentsToWordTimestamps({
      surahId: 2,
      ayahNumber: 1,
      segments,
    });

    expect(timestamps).toHaveLength(1);
    expect(timestamps[0].wordIndex).toBe(1);
  });

  it('resolves an ayah segment from existing second-based audio boundaries', () => {
    expect(
      resolveAyahAudioSegment({
        audioUrl: 'https://example.test/baqarah.mp3',
        surahId: 2,
        ayahStart: 1,
        ayahEnd: 1,
        audioStart: 1,
        audioEnd: 2.4,
      }),
    ).toMatchObject({
      audioUrl: 'https://example.test/baqarah.mp3',
      segmentType: 'AYAH',
      surahId: 2,
      ayahStart: 1,
      ayahEnd: 1,
      startTimeMs: 1000,
      endTimeMs: 2400,
      source: 'QURAN_CDN',
    });
  });

  it('resolves a custom segment from start and end word indexes', () => {
    expect(
      resolveCustomAudioSegment({
        audioUrl: 'https://example.test/baqarah.mp3',
        surahId: 2,
        ayahStart: 1,
        ayahEnd: 1,
        startWordIndex: 1,
        endWordIndex: 2,
        wordTimestamps,
      }),
    ).toMatchObject({
      segmentType: 'CUSTOM',
      startWordIndex: 1,
      endWordIndex: 2,
      startTimeMs: 1400,
      endTimeMs: 2400,
      source: 'QURAN_CDN',
    });
  });

  it('returns undefined for an invalid custom word range', () => {
    expect(
      resolveCustomAudioSegment({
        surahId: 2,
        ayahStart: 1,
        ayahEnd: 1,
        startWordIndex: 2,
        endWordIndex: 1,
        wordTimestamps,
      }),
    ).toBeUndefined();
  });

  it('returns undefined for waqaf mode when markers are missing', () => {
    expect(
      resolveWaqafAudioSegment({
        surahId: 2,
        ayahStart: 1,
        ayahEnd: 1,
        waqafIndex: 0,
        wordTimestamps,
      }),
    ).toBeUndefined();
  });

  it('resolves a waqaf segment when marker and timestamp exist', () => {
    const waqafMarkers: WidgetWaqafMarker[] = [
      {
        surahId: 2,
        ayahNumber: 1,
        wordIndex: 1,
        symbol: 'ج',
        type: 'permissible-stop',
      },
    ];

    expect(
      resolveWaqafAudioSegment({
        audioUrl: 'https://example.test/baqarah.mp3',
        surahId: 2,
        ayahStart: 1,
        ayahEnd: 1,
        waqafIndex: 0,
        wordTimestamps,
        waqafMarkers,
      }),
    ).toMatchObject({
      segmentType: 'WAQAF',
      startWordIndex: 0,
      endWordIndex: 1,
      startTimeMs: 1000,
      endTimeMs: 1800 + WAQAF_END_PADDING_MS,
      source: 'GENERATED',
    });
  });

  it('clamps padded waqaf segment end time to the ayah end timestamp', () => {
    const waqafMarkers: WidgetWaqafMarker[] = [
      {
        surahId: 2,
        ayahNumber: 1,
        wordIndex: 2,
        symbol: 'م',
        type: 'necessary-stop',
      },
    ];

    expect(
      resolveWaqafAudioSegment({
        surahId: 2,
        ayahStart: 1,
        ayahEnd: 1,
        waqafIndex: 0,
        wordTimestamps,
        waqafMarkers,
      }),
    ).toMatchObject({
      segmentType: 'WAQAF',
      endWordIndex: 2,
      endTimeMs: 2400,
    });
  });

  it('returns widget waqaf markers for the Al-Baqarah MVP sample data', () => {
    expect(getWidgetWaqafMarkersForAyah(2, 2)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surahId: 2,
          ayahNumber: 2,
          wordIndex: 4,
          symbol: 'ج',
        }),
      ]),
    );
  });

  it('detects the active word index from current time', () => {
    expect(getActiveWordIndexFromTime(wordTimestamps, 1000, 1)).toBe(0);
    expect(getActiveWordIndexFromTime(wordTimestamps, 1400, 1)).toBe(1);
    expect(getActiveWordIndexFromTime(wordTimestamps, 2400, 1)).toBeUndefined();
    expect(getActiveWordIndexFromTime(wordTimestamps, 999, 1)).toBeUndefined();
  });
});
