const WAQAF_SYMBOL_PRIORITY = ['ۖ', 'ۚ', 'ۗ', 'ۛ', 'ۘ', 'ۙ', 'ۜ', 'ۢ', 'ۭ', '۞'];

export const WAQAF_SYMBOL_METADATA = Object.fromEntries(
  WAQAF_SYMBOL_PRIORITY.map((symbol) => [
    symbol,
    {
      type: 'pause-sign',
      description: 'Auto-detected MVP waqaf marker from Quran text',
      priorWeight: 0.6,
    },
  ]),
);

const getWordTextFields = (word) =>
  [
    word.qpcUthmaniHafs,
    word.qpc_uthmani_hafs,
    word.textUthmani,
    word.text_uthmani,
    word.text,
    word.textIndopak,
    word.text_indopak,
    word.textUthmaniTajweed,
    word.text_uthmani_tajweed,
  ].filter((value) => typeof value === 'string' && value.length > 0);

export const extractWaqafSymbolFromWord = (word) => {
  const textFields = getWordTextFields(word);
  return WAQAF_SYMBOL_PRIORITY.find((symbol) =>
    textFields.some((textField) => textField.includes(symbol)),
  );
};

export const getVerseNumber = (verse) => verse.verseNumber ?? verse.verse_number;

export const getVerseKey = (verse) => verse.verseKey ?? verse.verse_key;

export const extractWaqafMarksFromVerse = (verse) => {
  const verseNumber = getVerseNumber(verse);
  const words = (verse.words ?? []).filter((word) => {
    const charTypeName = word.charTypeName ?? word.char_type_name;
    return charTypeName !== 'end';
  });

  return words.flatMap((word, index) => {
    if (index === words.length - 1) return [];
    const symbol = extractWaqafSymbolFromWord(word);
    if (!symbol) return [];

    const metadata = WAQAF_SYMBOL_METADATA[symbol];
    return [
      {
        chapterNumber: 2,
        verseNumber,
        wordIndex: word.position,
        symbol,
        type: metadata.type,
        description: metadata.description,
        priorWeight: metadata.priorWeight,
        source: 'generated',
      },
    ];
  });
};

export const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${url}`);
  }
  return response.json();
};

export const fetchAlBaqarahVerses = async () => {
  const params = new URLSearchParams({
    words: 'true',
    per_page: '286',
    page: '1',
    fields: 'text_uthmani,chapter_id',
    word_fields:
      'verse_key,verse_id,page_number,location,text_uthmani,text_imlaei_simple,qpc_uthmani_hafs',
    mushaf: '5',
  });
  const data = await fetchJson(
    `https://api.quran.com/api/qdc/verses/by_chapter/2?${params.toString()}`,
  );

  return data.verses ?? [];
};

export const fetchAlBaqarahAudioTimings = async () => {
  const data = await fetchJson(
    'https://api.quran.com/api/qdc/audio/reciters/7/audio_files?chapter=2&segments=true',
  );
  return data.audio_files?.[0]?.verse_timings ?? data.audioFiles?.[0]?.verseTimings ?? [];
};

export const convertSegmentsToTimestamps = (verseTiming) => {
  const verseKey = verseTiming.verse_key ?? verseTiming.verseKey;
  const ayahNumber = Number(String(verseKey).split(':')[1]);
  return (verseTiming.segments ?? [])
    .map(([wordIndex, startTimeMs, endTimeMs]) => ({
      ayahNumber,
      wordIndex: wordIndex - 1,
      startTimeMs,
      endTimeMs,
    }))
    .filter(
      (timestamp) =>
        Number.isInteger(timestamp.ayahNumber) &&
        Number.isInteger(timestamp.wordIndex) &&
        timestamp.wordIndex >= 0 &&
        Number.isFinite(timestamp.startTimeMs) &&
        Number.isFinite(timestamp.endTimeMs) &&
        timestamp.endTimeMs > timestamp.startTimeMs,
    );
};

export const resolveFirstWaqafSegmentDebug = ({ marker, wordTimestamps, ayahNumber }) => {
  if (!marker) return { fallbackReason: 'MARKER_NOT_FOUND' };

  const selectedWordIndex = marker.wordIndex - 1;
  if (!Number.isInteger(selectedWordIndex) || selectedWordIndex < 0) {
    return { selectedWordIndex, fallbackReason: 'INVALID_WORD_INDEX' };
  }

  const ayahTimestamps = wordTimestamps
    .filter((timestamp) => timestamp.ayahNumber === ayahNumber)
    .sort((a, b) => a.wordIndex - b.wordIndex);
  const startTimestamp = ayahTimestamps[0];
  const matchedTimestamp = ayahTimestamps.find(
    (timestamp) => timestamp.wordIndex === selectedWordIndex,
  );
  const endTimestamp = ayahTimestamps[ayahTimestamps.length - 1];

  if (!startTimestamp || !matchedTimestamp) {
    return { selectedWordIndex, fallbackReason: 'TIMESTAMP_NOT_FOUND' };
  }

  const endTimeMs = endTimestamp
    ? Math.min(matchedTimestamp.endTimeMs + 300, endTimestamp.endTimeMs)
    : matchedTimestamp.endTimeMs + 300;

  if (endTimeMs <= startTimestamp.startTimeMs) {
    return { selectedWordIndex, fallbackReason: 'END_CLAMP_INVALID' };
  }

  return {
    selectedWordIndex,
    matchedTimestamp,
    startTimeMs: startTimestamp.startTimeMs,
    endTimeMs,
    segmentType: 'WAQAF',
  };
};
