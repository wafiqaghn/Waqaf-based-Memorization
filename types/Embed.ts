import { QuranFont } from './QuranReader';

import ThemeTypeVariant from '@/redux/types/ThemeTypeVariant';

export type MushafType = 'qpc' | 'kfgqpc_v1' | 'kfgqpc_v2' | 'indopak' | 'tajweed';

/**
 * Type guard to check if a value is a valid MushafType.
 * @param {unknown} value The value to check.
 * @returns {boolean} True if the value is a valid MushafType.
 */
export const isMushafType = (value: unknown): value is MushafType => {
  return (
    typeof value === 'string' &&
    ['qpc', 'kfgqpc_v1', 'kfgqpc_v2', 'indopak', 'tajweed'].includes(value)
  );
};

/**
 * Gets the Quran font for a specific mushaf.
 * @param {MushafType} mushaf The mushaf type.
 * @returns {QuranFont} The corresponding Quran font.
 */
export const getQuranFontForMushaf = (mushaf: MushafType): QuranFont => {
  switch (mushaf) {
    case 'indopak':
      return QuranFont.IndoPak;
    case 'kfgqpc_v1':
      return QuranFont.MadaniV1;
    case 'kfgqpc_v2':
      return QuranFont.MadaniV2;
    case 'tajweed':
      return QuranFont.TajweedV4;
    default:
      return QuranFont.QPCHafs;
  }
};

export type WordTrimRange = {
  startWordIndex?: number;
  endWordIndex?: number;
};

export type WidgetTrimOptions = {
  arabic?: WordTrimRange;
  translations?: Record<string, WordTrimRange>;
};

export type WidgetAudioMode = 'ayah' | 'waqaf' | 'custom';

export type WidgetSegmentType = 'AYAH' | 'WAQAF' | 'CUSTOM' | 'WORD';

export type WidgetSegmentSource =
  | 'QURAN_CDN'
  | 'MANUAL'
  | 'MFA'
  | 'WHISPERX'
  | 'DTW'
  | 'GENERATED'
  | 'SAMPLE';

export type WidgetWordTimestamp = {
  surahId: number;
  ayahNumber: number;
  wordIndex: number;
  startTimeMs: number;
  endTimeMs: number;
  confidence?: number;
  source?: WidgetSegmentSource;
};

export type WidgetAudioSegment = {
  audioUrl?: string;
  segmentType: WidgetSegmentType;
  surahId: number;
  ayahStart: number;
  ayahEnd: number;
  startWordIndex?: number;
  endWordIndex?: number;
  startTimeMs: number;
  endTimeMs: number;
  confidence?: number;
  source?: WidgetSegmentSource;
};

export type WidgetWaqafMarker = {
  surahId: number;
  ayahNumber: number;
  wordIndex: number;
  symbol: string;
  type: string;
  description?: string;
  priorWeight?: number;
  source?: 'manual' | 'generated' | 'auto';
};

/**
 * Options for configuring the Ayah Widget.
 */
export type WidgetOptions = {
  // Should the widget have a play button
  enableAudio: boolean;

  // Minimal learning-plan mode
  lp?: boolean;

  // Should the widget display inline word-by-word translations
  enableWbw: boolean;

  // Should the widget display inline word-by-word transliteration
  enableWbwTransliteration: boolean;

  // The theme of the widget
  theme: ThemeTypeVariant;

  // The type of Mushaf to display
  mushaf: MushafType;

  // Should the widget display translator names
  showTranslatorNames: boolean;

  // Should the arabic verse be rendered
  showArabic: boolean;

  // Inclusive ending verse number when rendering a range
  rangeEnd?: number;

  // Should verses in a range be merged (Arabic together, then translations together)
  mergeVerses?: boolean;

  // Should the widget display tafsirs button
  showTafsirs: boolean;

  // Should the widget display reflections button
  showReflections: boolean;

  // Should the widget display lessons button
  showLessons: boolean;

  // Should the widget display answers button
  showAnswers: boolean;

  // Locale code for widget labels (e.g. "en", "fr")
  locale: string;

  // Localized labels for the widget
  labels: WidgetLabels;

  // Ayah identifier in S:V format (e.g. "33:56")
  ayah: string;

  // Whether any translations exist for the current ayah
  hasAnyTranslations: boolean;

  // Whether any answers exist for the current ayah
  hasAnswers: boolean;

  // Whether the verse has clarification questions (for answers icon state)
  isClarificationQuestion: boolean;

  // Surah name to show in the header
  surahName?: string;

  // Custom width to constrain the widget (e.g. "600px" or "100%")
  customWidth?: string;

  // Custom height to constrain the widget (e.g. "500px")
  customHeight?: string;

  // Audio URL for playback
  audioUrl?: string;

  // Start time (seconds) for the selected ayah audio segment
  audioStart?: number;

  // End time (seconds) for the selected ayah audio segment
  audioEnd?: number;

  // Optional timestamp-based audio segment mode. Defaults to existing ayah behavior when omitted.
  audioMode?: WidgetAudioMode;

  // Optional custom segment start word index from /embed/v1 query params.
  startWordIndex?: number;

  // Optional custom segment end word index from /embed/v1 query params.
  endWordIndex?: number;

  // Optional waqaf segment selector from /embed/v1 query params.
  waqafIndex?: number;

  // Optional resolved audio segment for future ayah/waqaf/custom playback modes.
  audioSegment?: WidgetAudioSegment;

  // Optional word-level timestamps used for custom segment resolution and highlighting.
  wordTimestamps?: WidgetWordTimestamp[];

  // Optional waqaf markers used as helper/prior metadata, not as ayah boundary ground truth.
  waqafMarkers?: WidgetWaqafMarker[];

  // Optional segment repeat count. Future parsing should clamp this to a safe range.
  repeatCount?: number;

  // Optional synchronized word highlighting toggle.
  enableWordHighlight?: boolean;
};

export type WidgetColors = {
  borderColor: string;
  linkColor: string;
  secondaryBg: string;
  secondaryText: string;
  hoverBg: string;
  iconColor: string;
  bgColor: string;
  textColor: string;
};

export type WidgetLabels = {
  quran: string;
  readOnQuran: string;
  surah: string;
  verse: string;
  tafsirs: string;
  reflections: string;
  lessons: string;
  answers: string;
};
