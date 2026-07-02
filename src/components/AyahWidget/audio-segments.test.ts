/* eslint-disable max-lines */
/* eslint-disable react-func/max-lines-per-function */
import { describe, expect, it } from 'vitest';

import {
  WAQAF_END_PADDING_MS,
  convertQuranCDNSegmentsToWordTimestamps,
  getActiveWordIndexFromTime,
  getWaqafSegmentResolutionDebugInfo,
  resolveAyahAudioSegment,
  resolveCustomAudioSegment,
  resolveWaqafAudioSegment,
} from './audio-segments';

import {
  debugWordTextFields,
  extractWaqafSymbols,
  extractWaqafSignsFromVerseWords,
  extractWaqafMarkersFromVerseWords,
  getResolvedWidgetWaqafMarkersForAyah,
  getWidgetWaqafMarkersForAyah,
  toCodePoints,
} from '@/data/waqafMarks';
import { GENERATED_AL_BAQARAH_WAQAF_MARKS } from '@/data/waqafMarks.alBaqarah.generated';
import type { WidgetWaqafMarker, WidgetWordTimestamp } from '@/types/Embed';
import type { QuranCDNSegment } from 'types/Segment';
import type Word from 'types/Word';

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

const buildWordTimestamps = (
  ayahNumber: number,
  endTimes: number[],
  startTimeMs = 1000,
): WidgetWordTimestamp[] => {
  let nextStartTimeMs = startTimeMs;
  return endTimes.map((endTimeMs, wordIndex) => {
    const timestamp: WidgetWordTimestamp = {
      surahId: 2,
      ayahNumber,
      wordIndex,
      startTimeMs: nextStartTimeMs,
      endTimeMs,
      source: 'QURAN_CDN',
    };
    nextStartTimeMs = endTimeMs;
    return timestamp;
  });
};

const mvpWaqafTimestamps: WidgetWordTimestamp[] = [
  ...buildWordTimestamps(2, [1800, 2600, 3100, 3800, 4600, 5200, 6400]),
  ...buildWordTimestamps(3, [1700, 2400, 3200, 4100, 4800, 5600, 6200, 7000]),
  ...buildWordTimestamps(4, [1600, 2300, 3000, 3600, 4200, 5000, 5600, 6300, 6900, 7600, 8200]),
  ...buildWordTimestamps(5, [1900, 2600, 3300, 4000, 4700, 5300, 5900, 6600]),
  ...buildWordTimestamps(7, [
    1700, 2400, 3200, 4100, 4800, 5600, 6200, 7000, 7800, 8400, 9100, 9800,
  ]),
];

const buildWord = (position: number, text: string, charTypeName = 'word'): Word =>
  ({
    position,
    charTypeName,
    textUthmani: text,
    qpcUthmaniHafs: text,
    text,
    location: `2:7:${position}`,
    audioUrl: null,
  }) as Word;

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

    expect(
      getWaqafSegmentResolutionDebugInfo({
        surahId: 2,
        ayahStart: 1,
        ayahEnd: 1,
        waqafIndex: 0,
        wordTimestamps,
      }),
    ).toMatchObject({
      markerCount: 0,
      fallbackReason: 'NO_ALLOWED_WAQAF_SIGN',
    });
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
    expect(
      [2, 3, 4, 5].map((ayahNumber) => getWidgetWaqafMarkersForAyah(2, ayahNumber)[0]),
    ).toEqual([
      expect.objectContaining({ surahId: 2, ayahNumber: 2, wordIndex: 4, symbol: 'ج' }),
      expect.objectContaining({ surahId: 2, ayahNumber: 3, wordIndex: 3, symbol: 'ج' }),
      expect.objectContaining({ surahId: 2, ayahNumber: 4, wordIndex: 5, symbol: 'ج' }),
      expect.objectContaining({ surahId: 2, ayahNumber: 5, wordIndex: 4, symbol: 'م' }),
    ]);
  });

  it('extracts one waqaf marker from word-level Quran text', () => {
    expect(
      extractWaqafMarkersFromVerseWords({
        chapterNumber: 2,
        verseNumber: 7,
        words: [
          buildWord(1, 'خَتَمَ'),
          buildWord(2, 'سَمۡعِهِمۡۖ'),
          buildWord(3, 'عَظِيمٞ'),
          buildWord(4, '٧', 'end'),
        ],
      }),
    ).toEqual([
      expect.objectContaining({
        surahId: 2,
        ayahNumber: 7,
        wordIndex: 1,
        symbol: 'ۖ',
        source: 'auto-runtime',
      }),
    ]);
  });

  it('debugs word text fields and code points without treating normal marks as waqaf', () => {
    expect(
      debugWordTextFields([
        buildWord(1, 'غِشَاوَةٌ'),
        buildWord(2, 'رَيْبَۛ'),
      ]),
    ).toEqual([
      expect.objectContaining({
        position: 1,
        charTypeName: 'word',
        textFields: expect.arrayContaining([
          expect.objectContaining({
            field: 'qpcUthmaniHafs',
            value: 'غِشَاوَةٌ',
            detectedWaqafSymbols: [],
            codePoints: expect.arrayContaining([{ char: 'ٌ', codePoint: 'U+064C' }]),
          }),
        ]),
      }),
      expect.objectContaining({
        position: 2,
        textFields: expect.arrayContaining([
          expect.objectContaining({
            field: 'qpcUthmaniHafs',
            value: 'رَيْبَۛ',
            detectedWaqafSymbols: ['ۛ'],
            codePoints: expect.arrayContaining([{ char: 'ۛ', codePoint: 'U+06DB' }]),
          }),
        ]),
      }),
    ]);
  });

  it('ignores normal Arabic harakat and tanwin when extracting waqaf symbols', () => {
    expect(extractWaqafSymbols('عَلَيْهِمْ')).toEqual([]);
    expect(extractWaqafSymbols('غِشَاوَةٌ')).toEqual([]);
    expect(extractWaqafSymbols('غِشَاوَةً')).toEqual([]);
    expect(extractWaqafSymbols('غِشَاوَةٍ')).toEqual([]);
    expect(extractWaqafSymbols('بِسْمِ ٱللَّهِ')).toEqual([]);
    expect(extractWaqafSymbols('رَيْبَ ۛ')).toEqual(['ۛ']);
    expect(extractWaqafSymbols('قُلُوبِهِمْ ۖ')).toEqual(['ۖ']);
  });

  it('reports code points so dhammahtain is visibly not an allowed waqaf sign', () => {
    expect(toCodePoints('ٌ')).toEqual([{ char: 'ٌ', codePoint: 'U+064C' }]);
    expect(extractWaqafSymbols('غِشَاوَةٌ')).toEqual([]);
    expect(toCodePoints('ۚ')).toEqual([{ char: 'ۚ', codePoint: 'U+06DA' }]);
    expect(extractWaqafSymbols('غِشَاوَةٌ ۚ')).toEqual(['ۚ']);
  });

  it('does not detect textual waqaf signs from normal Arabic word text', () => {
    expect(
      extractWaqafSignsFromVerseWords({
        chapterNumber: 33,
        verseNumber: 53,
        words: [
          buildWord(1, 'لَا'),
          buildWord(2, 'طَعَامٍ'),
          buildWord(3, 'أَطۡهَرُ'),
          buildWord(4, '٣٣', 'end'),
        ],
      }),
    ).toMatchObject({
      markers: [],
      ignoredSigns: [],
    });
  });

  it('classifies safe textual annotation signs without selecting prohibited or continue-preferred signs', () => {
    const result = extractWaqafSignsFromVerseWords({
      chapterNumber: 2,
      verseNumber: 1,
      words: [
        buildWord(1, 'قَالُوا'),
        buildWord(2, 'لا', 'pause'),
        buildWord(3, 'ثُمَّ'),
        buildWord(4, 'صلى', 'pause'),
        buildWord(5, 'بَلَى'),
        buildWord(6, 'ط', 'pause'),
        buildWord(7, '١', 'end'),
      ],
    });

    expect(result.markers).toEqual([
      expect.objectContaining({
        symbol: 'ط',
        wordIndex: 4,
        decision: 'stop-preferred',
        defaultCutCandidate: true,
        priority: 90,
      }),
    ]);
    expect(result.ignoredSigns).toEqual([
      expect.objectContaining({
        symbol: 'لا',
        reason: 'STOP_PROHIBITED_SIGN',
        decision: 'stop-prohibited',
      }),
      expect.objectContaining({
        symbol: 'صلى',
        reason: 'CONTINUE_PREFERRED_SIGN',
        decision: 'continue-preferred',
      }),
    ]);
  });

  it('reports ignored signs when no default waqaf cut candidate exists', () => {
    const debugInfo = getWaqafSegmentResolutionDebugInfo({
      surahId: 2,
      ayahStart: 1,
      ayahEnd: 1,
      waqafIndex: 0,
      wordTimestamps,
      waqafMarkers: [],
      ignoredWaqafSigns: [
        {
          symbol: 'لا',
          reason: 'STOP_PROHIBITED_SIGN',
          wordIndex: 1,
          decision: 'stop-prohibited',
        },
      ],
    });

    expect(debugInfo).toMatchObject({
      markerCount: 0,
      fallbackReason: 'NO_DEFAULT_CUT_CANDIDATE',
      ignoredSigns: [
        expect.objectContaining({
          symbol: 'لا',
          reason: 'STOP_PROHIBITED_SIGN',
        }),
      ],
    });
  });

  it('extracts multiple waqaf markers from one verse and ignores the final ayah marker', () => {
    expect(
      extractWaqafMarkersFromVerseWords({
        chapterNumber: 2,
        verseNumber: 7,
        words: [
          buildWord(1, 'خَتَمَ'),
          buildWord(2, 'سَمۡعِهِمۡۖ'),
          buildWord(3, 'غِشَٰوَةٞۖ'),
          buildWord(4, 'عَظِيمۭٞ'),
          buildWord(5, '٧', 'end'),
        ],
      }),
    ).toEqual([
      expect.objectContaining({ wordIndex: 1, symbol: 'ۖ' }),
      expect.objectContaining({ wordIndex: 2, symbol: 'ۖ' }),
    ]);
  });

  it('extracts runtime waqaf markers for a non-Al-Baqarah long ayah fixture', () => {
    const markers = extractWaqafMarkersFromVerseWords({
      chapterNumber: 73,
      verseNumber: 20,
      words: [
        buildWord(1, 'إِنَّ'),
        buildWord(2, 'رَبَّكَ'),
        buildWord(3, 'يَعْلَمُۚ'),
        buildWord(4, 'وَطَائِفَةٞۖ'),
        buildWord(5, 'مِّنَ'),
        buildWord(6, 'ٱلَّذِينَ'),
        buildWord(7, '٢٠', 'end'),
      ],
    });

    expect(markers).toEqual([
      expect.objectContaining({
        surahId: 73,
        ayahNumber: 20,
        wordIndex: 2,
        symbol: 'ۚ',
        source: 'auto-runtime',
      }),
      expect.objectContaining({
        surahId: 73,
        ayahNumber: 20,
        wordIndex: 3,
        symbol: 'ۖ',
        source: 'auto-runtime',
      }),
    ]);
  });

  it('extracts runtime markers from snake_case API word fields for a 74:31-like fixture', () => {
    const markers = extractWaqafMarkersFromVerseWords({
      chapterNumber: 74,
      verseNumber: 31,
      words: [
        { position: 1, char_type_name: 'word', qpc_uthmani_hafs: 'وَمَا', audioUrl: null },
        { position: 2, char_type_name: 'word', qpc_uthmani_hafs: 'جَعَلۡنَاۖ', audioUrl: null },
        { position: 3, char_type_name: 'word', qpc_uthmani_hafs: 'عِدَّتَهُمۡۚ', audioUrl: null },
        { position: 4, char_type_name: 'word', qpc_uthmani_hafs: 'إِلَّا', audioUrl: null },
        { position: 5, char_type_name: 'end', qpc_uthmani_hafs: '٣١', audioUrl: null },
      ] as Word[],
    });

    expect(markers.map((marker) => marker.source)).toEqual(['auto-runtime', 'auto-runtime']);
    expect(markers.map((marker) => marker.symbol)).toEqual(['ۖ', 'ۚ']);
  });

  it('ignores Quranic annotations that are not default runtime waqaf cut points', () => {
    expect(extractWaqafSymbols('عَظِيمۭٞ')).toEqual([]);
    expect(extractWaqafSymbols('وَيَبۡصُۜطُ')).toEqual(['ۜ']);
    expect(extractWaqafSymbols('۞')).toEqual([]);
    expect(
      extractWaqafMarkersFromVerseWords({
        chapterNumber: 1,
        verseNumber: 1,
        words: [
          buildWord(1, 'عَظِيمۭٞ'),
          buildWord(2, 'ۢ'),
          buildWord(3, '۞'),
          buildWord(4, '١', 'end'),
        ],
      }),
    ).toEqual([]);
  });

  it('selects the first and second runtime waqaf markers in reading order', () => {
    const waqafMarkers = extractWaqafMarkersFromVerseWords({
      chapterNumber: 73,
      verseNumber: 20,
      words: [
        buildWord(1, 'إِنَّ'),
        buildWord(2, 'يَعْلَمُۚ'),
        buildWord(3, 'عَلَيْكُمۖ'),
        buildWord(4, 'خَيْرٗا'),
        buildWord(5, '٢٠', 'end'),
      ],
    });
    const longAyahTimestamps = buildWordTimestamps(20, [1200, 2200, 3600, 4600]);

    expect(
      getWaqafSegmentResolutionDebugInfo({
        surahId: 73,
        ayahStart: 20,
        ayahEnd: 20,
        waqafIndex: 0,
        wordTimestamps: longAyahTimestamps,
        waqafMarkers,
      }),
    ).toMatchObject({
      selectedSymbol: 'ۚ',
      selectedWordIndex: 1,
      markerSource: 'auto-runtime',
      segment: expect.objectContaining({ segmentType: 'WAQAF', endWordIndex: 1 }),
    });

    expect(
      getWaqafSegmentResolutionDebugInfo({
        surahId: 73,
        ayahStart: 20,
        ayahEnd: 20,
        waqafIndex: 1,
        wordTimestamps: longAyahTimestamps,
        waqafMarkers,
      }),
    ).toMatchObject({
      selectedSymbol: 'ۖ',
      selectedWordIndex: 2,
      markerSource: 'auto-runtime',
      segment: expect.objectContaining({ segmentType: 'WAQAF', endWordIndex: 2 }),
    });
  });

  it('has generated Al-Baqarah markers, including 2:7 internal pause signs', () => {
    const ayah7Markers = getWidgetWaqafMarkersForAyah(2, 7);
    const generatedSymbols = new Set(
      GENERATED_AL_BAQARAH_WAQAF_MARKS.map((marker) => marker.symbol),
    );

    expect(GENERATED_AL_BAQARAH_WAQAF_MARKS.length).toBeGreaterThan(0);
    expect(generatedSymbols).toEqual(new Set(['ۖ', 'ۚ', 'ۗ', 'ۘ', 'ۙ', 'ۛ', 'ۜ']));
    expect(generatedSymbols.has('ٌ')).toBe(false);
    expect(generatedSymbols.has('ۭ')).toBe(false);
    expect(generatedSymbols.has('ۢ')).toBe(false);
    expect(generatedSymbols.has('۞')).toBe(false);
    expect(ayah7Markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surahId: 2,
          ayahNumber: 7,
          wordIndex: 5,
          symbol: 'ۖ',
          source: 'generated',
        }),
        expect.objectContaining({
          surahId: 2,
          ayahNumber: 7,
          wordIndex: 8,
          symbol: 'ۖ',
          source: 'generated',
        }),
      ]),
    );
  });

  it('merges generated and runtime auto markers without duplicates', () => {
    const markers = getResolvedWidgetWaqafMarkersForAyah({
      chapterNumber: 2,
      verseNumber: 7,
      words: [
        buildWord(1, 'خَتَمَ'),
        buildWord(2, 'ٱللَّهُ'),
        buildWord(3, 'عَلَىٰ'),
        buildWord(4, 'قُلُوبِهِمۡ'),
        buildWord(5, 'وَعَلَىٰ'),
        buildWord(6, 'سَمۡعِهِمۡۖ'),
        buildWord(7, 'وَعَلَىٰٓ'),
        buildWord(8, 'أَبۡصَٰرِهِمۡ'),
        buildWord(9, 'غِشَٰوَةٞۖ'),
        buildWord(10, 'وَلَهُمۡ'),
        buildWord(11, 'عَذَابٌ'),
        buildWord(12, 'عَظِيمٞ'),
        buildWord(13, '٧', 'end'),
      ],
    });

    expect(markers.filter((marker) => marker.ayahNumber === 7 && marker.symbol === 'ۖ')).toHaveLength(
      2,
    );
    expect(markers.map((marker) => marker.source)).toEqual(['generated', 'generated']);
  });

  it('keeps manual markers ahead of generated markers for override ayahs', () => {
    expect(getResolvedWidgetWaqafMarkersForAyah({ chapterNumber: 2, verseNumber: 2 })[0]).toEqual(
      expect.objectContaining({
        ayahNumber: 2,
        wordIndex: 4,
        symbol: 'ج',
        source: 'manual',
      }),
    );
  });

  it('resolves waqaf segments for every Al-Baqarah MVP marker ayah with timestamps', () => {
    [2, 3, 4, 5].forEach((ayahNumber) => {
      const markers = getWidgetWaqafMarkersForAyah(2, ayahNumber);
      const debugInfo = getWaqafSegmentResolutionDebugInfo({
        surahId: 2,
        ayahStart: ayahNumber,
        ayahEnd: ayahNumber,
        waqafIndex: 0,
        wordTimestamps: mvpWaqafTimestamps,
        waqafMarkers: markers,
      });

      expect(debugInfo).toMatchObject({
        markerCount: expect.any(Number),
        selectedMarker: markers[0],
        markerSource: markers[0].source,
        selectedWordIndex: markers[0].wordIndex,
        segment: {
          segmentType: 'WAQAF',
          ayahStart: ayahNumber,
          ayahEnd: ayahNumber,
          endWordIndex: markers[0].wordIndex,
        },
      });
      expect(debugInfo.fallbackReason).toBeUndefined();
      expect(debugInfo.matchedTimestamp).toMatchObject({
        ayahNumber,
        wordIndex: markers[0].wordIndex,
      });
      expect(debugInfo.segment?.startTimeMs).toBeLessThan(Number(debugInfo.segment?.endTimeMs));
    });
  });

  it('resolves a waqaf segment for generated Al-Baqarah 2:7 markers', () => {
    const markers = getWidgetWaqafMarkersForAyah(2, 7);
    const debugInfo = getWaqafSegmentResolutionDebugInfo({
      surahId: 2,
      ayahStart: 7,
      ayahEnd: 7,
      waqafIndex: 0,
      wordTimestamps: mvpWaqafTimestamps,
      waqafMarkers: markers,
    });

    expect(debugInfo).toMatchObject({
      markerCount: expect.any(Number),
      selectedSymbol: 'ۖ',
      selectedSymbolCodePoint: 'U+06D6',
      selectedSymbolAllowed: true,
      markerSource: 'generated',
      selectedWordIndex: 5,
      matchedTimestamp: expect.objectContaining({
        ayahNumber: 7,
        wordIndex: 5,
      }),
      segment: expect.objectContaining({
        segmentType: 'WAQAF',
        ayahStart: 7,
        ayahEnd: 7,
        endWordIndex: 5,
      }),
    });
  });

  it('returns an explicit fallback reason when a waqaf marker points to a missing word timestamp', () => {
    const debugInfo = getWaqafSegmentResolutionDebugInfo({
      surahId: 2,
      ayahStart: 1,
      ayahEnd: 1,
      waqafIndex: 0,
      wordTimestamps,
      waqafMarkers: [
        {
          surahId: 2,
          ayahNumber: 1,
          wordIndex: 99,
          symbol: 'ج',
          type: 'permissible-stop',
        },
      ],
    });

    expect(debugInfo).toMatchObject({
      markerCount: 1,
      selectedWordIndex: 99,
      matchedTimestamp: undefined,
      fallbackReason: 'TIMESTAMP_NOT_FOUND',
    });
    expect(debugInfo.segment).toBeUndefined();
  });

  it('returns an explicit fallback reason when a waqaf marker has an invalid word index', () => {
    const debugInfo = getWaqafSegmentResolutionDebugInfo({
      surahId: 2,
      ayahStart: 1,
      ayahEnd: 1,
      waqafIndex: 0,
      wordTimestamps,
      waqafMarkers: [
        {
          surahId: 2,
          ayahNumber: 1,
          wordIndex: -1,
          symbol: 'ج',
          type: 'permissible-stop',
        },
      ],
    });

    expect(debugInfo).toMatchObject({
      markerCount: 1,
      selectedWordIndex: -1,
      fallbackReason: 'INVALID_WORD_INDEX',
    });
    expect(debugInfo.segment).toBeUndefined();
  });

  it('keeps a valid waqaf segment when padding is clamped by the next ayah boundary', () => {
    const marker = {
      surahId: 2,
      ayahNumber: 1,
      wordIndex: 2,
      symbol: 'م',
      type: 'necessary-stop',
    };
    const debugInfo = getWaqafSegmentResolutionDebugInfo({
      surahId: 2,
      ayahStart: 1,
      ayahEnd: 1,
      waqafIndex: 0,
      wordTimestamps,
      waqafMarkers: [marker],
    });

    expect(debugInfo).toMatchObject({
      selectedMarker: marker,
      matchedTimestamp: wordTimestamps[2],
      nextWordTimestamp: undefined,
      computedEndTimeMs: 2400,
      segment: {
        segmentType: 'WAQAF',
        endWordIndex: 2,
        endTimeMs: 2400,
      },
    });
  });

  it('detects the active word index from current time', () => {
    expect(getActiveWordIndexFromTime(wordTimestamps, 1000, 1)).toBe(0);
    expect(getActiveWordIndexFromTime(wordTimestamps, 1400, 1)).toBe(1);
    expect(getActiveWordIndexFromTime(wordTimestamps, 2400, 1)).toBeUndefined();
    expect(getActiveWordIndexFromTime(wordTimestamps, 999, 1)).toBeUndefined();
  });
});
