import { extractWaqafMarksFromVerse, fetchAlBaqarahVerses } from './waqaf-utils.mjs';
import { writeFile } from 'node:fs/promises';

const formatMarker = (marker) => `  {
    chapterNumber: ${marker.chapterNumber},
    verseNumber: ${marker.verseNumber},
    wordIndex: ${marker.wordIndex},
    symbol: '${marker.symbol}',
    type: '${marker.type}',
    description: '${marker.description}',
    priorWeight: ${marker.priorWeight},
    source: '${marker.source}',
  }`;

const verses = await fetchAlBaqarahVerses();
const markers = verses.flatMap(extractWaqafMarksFromVerse);

const output = `import type { WaqafMark } from './waqafMarks';

/**
 * Auto-generated MVP waqaf markers for Al-Baqarah.
 *
 * Generated from word-level Quran text fields. \`wordIndex\` is 1-based in this file to match
 * QuranCDN timing segment word locations. Widget-facing helpers convert it to zero-based indexes.
 */
export const GENERATED_AL_BAQARAH_WAQAF_MARKS: readonly WaqafMark[] = [
${markers.map(formatMarker).join(',\n')}
];
`;

await writeFile(new URL('../data/waqafMarks.alBaqarah.generated.ts', import.meta.url), output);

const ayahsWithMarkers = new Set(markers.map((marker) => marker.verseNumber));
console.log(`Generated ${markers.length} Al-Baqarah waqaf markers.`);
console.log(`Ayahs with detected internal waqaf markers: ${ayahsWithMarkers.size}`);
