import {
  convertSegmentsToTimestamps,
  extractWaqafMarksFromVerse,
  fetchAlBaqarahAudioTimings,
  fetchAlBaqarahVerses,
  getVerseNumber,
  resolveFirstWaqafSegmentDebug,
} from './waqaf-utils.mjs';

const verses = await fetchAlBaqarahVerses();
const verseTimings = await fetchAlBaqarahAudioTimings();
const wordTimestamps = verseTimings.flatMap(convertSegmentsToTimestamps);

const rows = verses.map((verse) => {
  const verseNumber = getVerseNumber(verse);
  const markers = extractWaqafMarksFromVerse(verse);
  const debugInfo = resolveFirstWaqafSegmentDebug({
    marker: markers[0],
    wordTimestamps,
    ayahNumber: verseNumber,
  });

  return {
    verseNumber,
    markerCount: markers.length,
    symbols: markers.map((marker) => marker.symbol),
    wordIndexes: markers.map((marker) => marker.wordIndex),
    hasTimestamps: wordTimestamps.some((timestamp) => timestamp.ayahNumber === verseNumber),
    segmentType: debugInfo.segmentType,
    fallbackReason: debugInfo.fallbackReason,
  };
});

rows.forEach((row) => {
  console.log(
    [
      `2:${row.verseNumber}`,
      `markers=${row.markerCount}`,
      `symbols=${row.symbols.join('') || '-'}`,
      `wordIndexes=${row.wordIndexes.join(',') || '-'}`,
      `timestamps=${row.hasTimestamps ? 'yes' : 'no'}`,
      row.segmentType ? `segment=${row.segmentType}` : `fallback=${row.fallbackReason}`,
    ].join(' '),
  );
});

const fallbackCounts = rows.reduce((counts, row) => {
  if (row.segmentType === 'WAQAF') return counts;
  counts[row.fallbackReason] = (counts[row.fallbackReason] ?? 0) + 1;
  return counts;
}, {});

console.log('');
console.log(`Al-Baqarah total ayahs: ${rows.length}`);
console.log(
  `Ayahs with detected internal waqaf markers: ${
    rows.filter((row) => row.markerCount > 0).length
  }`,
);
console.log(
  `Ayahs resolving WAQAF segment: ${rows.filter((row) => row.segmentType === 'WAQAF').length}`,
);
console.log(`Ayahs falling back by MARKER_NOT_FOUND: ${fallbackCounts.MARKER_NOT_FOUND ?? 0}`);
console.log(`Ayahs failing due to TIMESTAMP_NOT_FOUND: ${fallbackCounts.TIMESTAMP_NOT_FOUND ?? 0}`);
console.log(`Ayahs failing due to INVALID_WORD_INDEX: ${fallbackCounts.INVALID_WORD_INDEX ?? 0}`);
console.log(`Ayahs failing due to END_CLAMP_INVALID: ${fallbackCounts.END_CLAMP_INVALID ?? 0}`);
