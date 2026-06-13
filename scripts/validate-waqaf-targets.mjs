import {
  convertSegmentsToTimestamps,
  extractWaqafSignsFromVerse,
  fetchChapterAudioTimings,
  fetchVerseByKey,
  getVerseKey,
  resolveFirstWaqafSegmentDebug,
  toCodePoints,
} from './waqaf-utils.mjs';

const TARGET_VERSE_KEYS = ['73:20', '74:31', '2:282', '4:12', '4:176', '9:60', '24:35', '33:53'];

const chapterTimings = new Map();

const getWordText = (verse, wordIndex) => {
  const word = (verse.words ?? []).find((item) => item.position === wordIndex + 1);
  return (
    word?.qpc_uthmani_hafs ??
    word?.qpcUthmaniHafs ??
    word?.text_uthmani ??
    word?.textUthmani ??
    word?.text ??
    ''
  );
};

const getWordTimestampsForChapter = async (chapterNumber) => {
  if (!chapterTimings.has(chapterNumber)) {
    const timings = await fetchChapterAudioTimings(chapterNumber);
    chapterTimings.set(chapterNumber, timings.flatMap(convertSegmentsToTimestamps));
  }
  return chapterTimings.get(chapterNumber);
};

for (const verseKey of TARGET_VERSE_KEYS) {
  const verse = await fetchVerseByKey(verseKey);
  const [chapterSegment, ayahSegment] = getVerseKey(verse).split(':');
  const chapterNumber = Number(chapterSegment);
  const ayahNumber = Number(ayahSegment);
  const wordTimestamps = await getWordTimestampsForChapter(chapterNumber);
  const extraction = extractWaqafSignsFromVerse(verse, 'auto-runtime');
  const selectedDefaultMarker = extraction.markers[0];
  const resolvedSegment = resolveFirstWaqafSegmentDebug({
    marker: selectedDefaultMarker,
    wordTimestamps,
    ayahNumber,
  });

  console.log(
    JSON.stringify(
      {
        verseKey,
        detectedSigns: extraction.markers.map((marker) => ({
          symbol: marker.symbol,
          codePoints: toCodePoints(marker.symbol).map((entry) => entry.codePoint),
          wordIndex: marker.wordIndex - 1,
          wordText: getWordText(verse, marker.wordIndex - 1),
          decision: marker.decision,
          defaultCutCandidate: marker.defaultCutCandidate,
          priority: marker.priority,
          source: marker.source,
        })),
        selectedDefaultMarker: selectedDefaultMarker
          ? {
              symbol: selectedDefaultMarker.symbol,
              wordIndex: selectedDefaultMarker.wordIndex - 1,
              decision: selectedDefaultMarker.decision,
              priority: selectedDefaultMarker.priority,
            }
          : undefined,
        ignoredSigns: extraction.ignoredSigns.map((ignoredSign) => ({
          symbol: ignoredSign.symbol,
          reason: ignoredSign.reason,
          wordIndex: ignoredSign.wordIndex,
          wordText: ignoredSign.wordText,
          decision: ignoredSign.decision,
        })),
        resolvedSegment: resolvedSegment.segmentType
          ? {
              segmentType: resolvedSegment.segmentType,
              startTimeMs: resolvedSegment.startTimeMs,
              endTimeMs: resolvedSegment.endTimeMs,
            }
          : undefined,
        fallbackReason: resolvedSegment.fallbackReason,
      },
      null,
      2,
    ),
  );
}
