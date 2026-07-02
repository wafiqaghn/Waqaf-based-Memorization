const WAQAF_SYMBOL_PRIORITY = ['ۖ', 'ۚ', 'ۗ', 'ۘ', 'ۙ', 'ۛ', 'ۜ'];
const TEXTUAL_WAQAF_SIGNS = ['لا', 'ط', 'صلى'];

export const WAQAF_SYMBOL_METADATA = Object.fromEntries(
  WAQAF_SYMBOL_PRIORITY.map((symbol) => [
    symbol,
    {
      type: 'pause-sign',
      decision: 'stop-allowed',
      defaultCutCandidate: true,
      priority: 60,
      description: 'Auto-detected MVP waqaf marker from Quran text',
      priorWeight: 0.6,
    },
  ]),
);

WAQAF_SYMBOL_METADATA['ط'] = {
  type: 'waqaf-mutlaq',
  decision: 'stop-preferred',
  defaultCutCandidate: true,
  priority: 90,
  description: 'Waqaf Mutlaq: stopping is preferred',
  priorWeight: 0.9,
};
WAQAF_SYMBOL_METADATA['لا'] = {
  type: 'waqaf-mamnu',
  decision: 'stop-prohibited',
  defaultCutCandidate: false,
  priority: 0,
  description: 'Waqaf Mamnu: stopping is prohibited',
  priorWeight: 0,
};
WAQAF_SYMBOL_METADATA['صلى'] = {
  type: 'al-washlu-aula',
  decision: 'continue-preferred',
  defaultCutCandidate: false,
  priority: 10,
  description: 'Al-Washlu Aula: continuing is preferred',
  priorWeight: 0.1,
};

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

export const toCodePoints = (text) =>
  Array.from(text).map((char) => ({
    char,
    codePoint: `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
  }));

const normalizeAnnotationText = (value) => value.replace(/<[^>]+>/g, '').replace(/\s|\u200C/g, '');

const isAnnotationWord = (word) => (word.charTypeName ?? word.char_type_name) === 'pause';

const extractSafeTextualAnnotation = (word) => {
  if (!isAnnotationWord(word)) return undefined;
  const normalizedFields = getWordTextFields(word).map(normalizeAnnotationText);
  return TEXTUAL_WAQAF_SIGNS.find((symbol) =>
    normalizedFields.some((textField) => textField === symbol),
  );
};

const getWordText = (word) => getWordTextFields(word)[0] ?? word.location ?? '';

const getIgnoreReason = (metadata) => {
  if (metadata?.decision === 'stop-prohibited') return 'STOP_PROHIBITED_SIGN';
  if (metadata?.decision === 'continue-preferred') return 'CONTINUE_PREFERRED_SIGN';
  return 'NO_DEFAULT_CUT_CANDIDATE';
};

export const getVerseNumber = (verse) => verse.verseNumber ?? verse.verse_number;

export const getVerseKey = (verse) => verse.verseKey ?? verse.verse_key;

export const extractWaqafSignsFromVerse = (verse, source = 'generated') => {
  const verseNumber = getVerseNumber(verse);
  const words = (verse.words ?? []).filter((word) => {
    const charTypeName = word.charTypeName ?? word.char_type_name;
    return charTypeName !== 'end';
  });

  const markers = [];
  const ignoredSigns = [];

  words.forEach((word, index) => {
    if (index === words.length - 1 && !isAnnotationWord(word)) return;
    const safeTextualSymbol = extractSafeTextualAnnotation(word);
    const symbol = safeTextualSymbol ?? extractWaqafSymbolFromWord(word);
    if (!symbol) return;
    const metadata = WAQAF_SYMBOL_METADATA[symbol];

    if (metadata?.defaultCutCandidate) {
      markers.push({
        chapterNumber: Number(String(getVerseKey(verse)).split(':')[0]),
        verseNumber,
        wordIndex: safeTextualSymbol ? Math.max(1, index) : word.position,
        symbol,
        type: metadata.type,
        decision: metadata.decision,
        defaultCutCandidate: metadata.defaultCutCandidate,
        priority: metadata.priority,
        description: metadata.description,
        priorWeight: metadata.priorWeight,
        source,
      });
      return;
    }

    ignoredSigns.push({
      symbol,
      codePoints: toCodePoints(symbol).map((entry) => entry.codePoint),
      wordIndex: safeTextualSymbol ? Math.max(0, index - 1) : word.position - 1,
      wordText: getWordText(word),
      decision: metadata?.decision,
      defaultCutCandidate: metadata?.defaultCutCandidate,
      priority: metadata?.priority,
      source,
      reason: getIgnoreReason(metadata),
    });
  });

  return { markers, ignoredSigns };
};

export const extractWaqafMarksFromVerse = (verse) =>
  extractWaqafSignsFromVerse(verse, 'generated').markers;

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

export const fetchVerseByKey = async (verseKey) => {
  const params = new URLSearchParams({
    words: 'true',
    fields: 'text_uthmani,text_uthmani_tajweed,chapter_id',
    word_fields:
      'verse_key,verse_id,page_number,location,text_uthmani,text_uthmani_tajweed,text_imlaei_simple,qpc_uthmani_hafs',
    mushaf: '5',
  });
  const data = await fetchJson(
    `https://api.quran.com/api/qdc/verses/by_key/${verseKey}?${params.toString()}`,
  );
  return data.verse;
};

export const fetchAlBaqarahAudioTimings = async () => {
  const data = await fetchJson(
    'https://api.quran.com/api/qdc/audio/reciters/7/audio_files?chapter=2&segments=true',
  );
  return data.audio_files?.[0]?.verse_timings ?? data.audioFiles?.[0]?.verseTimings ?? [];
};

export const fetchChapterAudioTimings = async (chapterNumber) => {
  const data = await fetchJson(
    `https://api.quran.com/api/qdc/audio/reciters/7/audio_files?chapter=${chapterNumber}&segments=true`,
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
  if (!marker) return { fallbackReason: 'NO_ALLOWED_WAQAF_SIGN' };

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
