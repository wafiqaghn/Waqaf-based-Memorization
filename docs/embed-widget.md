# Embed Widget

This document is a full reference for the Tartila Ayah embed widget: architecture, data flow, fonts,
and how to extend it safely. Use this if you are onboarding or adding new widget options.

## What the widget is

The widget renders one ayah (or a small range) with Arabic text, translations, optional audio, and
action buttons. It is embedded on external sites via an `<iframe>` pointing to `/embed/v1`, and it
can also be configured through the Tartila builder page inside this app.

## Key entry points

| File                                                | Purpose                                       |
| --------------------------------------------------- | --------------------------------------------- |
| `src/pages/embed/index.tsx`                         | Builder page UI                               |
| `src/pages/embed/v1.tsx`                            | Embed page (iframe content)                   |
| `src/components/AyahWidget/widget-config.ts`        | Main config entry (re-exports modules)        |
| `src/components/AyahWidget/widget-types.ts`         | Type definitions                              |
| `src/components/AyahWidget/widget-defaults.ts`      | Default values and constants                  |
| `src/components/AyahWidget/widget-embed.ts`         | Iframe URL and snippet builders               |
| `src/components/AyahWidget/widget-form.ts`          | Builder form field definitions                |
| `src/components/AyahWidget/widget-utils.ts`         | Utility functions (formatting, grouping)      |
| `src/components/AyahWidget/getAyahWidgetData.ts`    | Server-side data fetching                     |
| `src/components/AyahWidget/queryParsing.ts`         | Query parameter parsing utilities             |
| `src/hooks/widget/useAyahWidgetPreview.ts`          | Preview hook for the builder                  |
| `src/hooks/widget/useWidgetInteractions.ts`         | Client-side interactions (copy, share, audio) |
| `src/hooks/widget/useAyahWidgetEmbedPreferences.ts` | Hook for widget embed preferences             |

## High-level data flow

1. Builder page renders a configuration UI (`BuilderConfigForm`) and a live preview
   (`BuilderPreview`).
2. User changes are stored in React state + Redux overrides.
3. Preview hook builds an iframe URL for `/embed/v1` based on preferences.
4. The iframe renders the embed page, which loads the widget UI via SSR.

## Module structure

The widget configuration is split into focused modules:

```
src/components/AyahWidget/
├── widget-types.ts      # Type definitions (Preferences, RangeMeta, etc.)
├── widget-defaults.ts   # DEFAULTS, INITIAL_PREFERENCES, getMushafFromQuranFont
├── widget-embed.ts      # buildEmbedIframeSrc, buildEmbedIframeConfig, buildEmbedSnippet
├── widget-form.ts       # WIDGET_FIELDS, WIDGET_FORM_BLOCKS, getWidgetLocaleOptions
├── widget-config.ts     # Main entry: re-exports + utility functions
├── getAyahWidgetData.ts # Server-side data fetching
└── queryParsing.ts      # Shared query param parsers
```

### Main exports from widget-config.ts

- `DEFAULTS`: static defaults (surah, ayah, reciter, iframe URL)
- `INITIAL_PREFERENCES`: base preferences for a blank widget
- `getBasePreferences`: merges site defaults (theme/locale/mushaf/wbw) into widget defaults
- `applyWidgetOverrides`: merges Redux overrides into base preferences
- `buildOverridesFromDiff`: creates a minimal override patch after user changes
- `buildEmbedIframeSrc`: builds the `/embed/v1` URL with query params
- `buildEmbedIframeConfig`: computes iframe URL + sizing for snippet/preview
- `buildEmbedSnippet`: builds the final embed HTML snippet
- `WIDGET_FIELDS` and `WIDGET_FORM_BLOCKS`: drive the builder UI

## Builder behavior

The builder maintains two "sources" of defaults:

- Site settings (theme, locale, mushaf, WBW)
- Previously saved widget overrides (Redux)

Flow in `src/pages/embed/index.tsx`:

1. Build base preferences from site settings (`getBasePreferences`).
2. Apply stored widget overrides (`applyWidgetOverrides`).
3. Persist future user changes using `setUserPreferences` which also updates overrides.

This means:

- First time visit uses site defaults.
- Any user change becomes an override.
- Returning to `/embed` uses overrides first, otherwise site defaults.

### Translations behavior

Translations are stored as objects in `Preferences`, but overrides store only IDs. On load,
translations are rehydrated once translations are fetched.

### Range behavior

Range selection is clamped:

- Max 10 verses from the start
- Never beyond the chapter verse count

The range UI is normalized by `normalizeRangePreferences`. When range is enabled/disabled, it
recomputes a valid `rangeEnd`.

## Preview behavior

`src/hooks/widget/useAyahWidgetPreview.ts`:

- Clears the preview container
- Creates an `<iframe>` inside the preview container
- Uses `buildEmbedIframeConfig` to compute URL + sizing

## Embed iframe

The embed is an iframe pointing to `/embed/v1` with query params.

### Clipboard permissions

The widget uses the Clipboard API for copy/share actions. When embedding, allow clipboard access on
the iframe:

```html
<iframe allow="clipboard-write" ...></iframe>
```

### Auto-resize script

To keep the iframe height aligned with the embed content, include the resizer script next to the
iframe. The script listens for resize events from the embed page and updates the iframe height to
match its content. When the height field is empty, the iframe always fits its content. When a height
is provided, it is treated as a max height: the iframe still shrinks to fit content, but will not
grow beyond the configured limit.

```html
<iframe
  src="https://quran.com/embed/v1?verses=33:56"
  width="100%"
  data-quran-embed="true"
  data-quran-embed-max-height="350px"
  height="350px"
  allow="clipboard-write"
  frameborder="0"
>
</iframe>
<script defer src="https://quran.com/widget/embed-widget.js"></script>
```

If you are using a custom embed domain, load the script from the same origin as the iframe `src`.

### Environment variables

- `NEXT_PUBLIC_EMBED_URL`: forces the iframe base URL (useful for local/testing)

### Query parameters

| Parameter             | Description                                          | Default       |
| --------------------- | ---------------------------------------------------- | ------------- |
| `verses`              | Verse range (e.g., `33:56` or `33:56-60`)            | `33:56`       |
| `translations`        | Comma-separated translation IDs                      | -             |
| `audio`               | Enable audio (`true`/`false`)                        | `true`        |
| `reciter`             | Reciter ID                                           | `7`           |
| `audioMode`           | Audio segment mode: `ayah`, `waqaf`, or `custom`     | `ayah`        |
| `startWord`           | Zero-based start word index for custom audio mode    | -             |
| `endWord`             | Zero-based inclusive end word index for custom mode  | -             |
| `waqaf`               | Zero-based waqaf marker index for waqaf mode         | -             |
| `repeat`              | Repeat count, clamped 1-20                           | `1`           |
| `wordHighlight`       | Enable active-word highlighting while audio plays    | `false`       |
| `theme`               | Theme (`light`/`dark`/`sepia`)                       | `light`       |
| `mushaf`              | Mushaf type (`qpc`, `kfgqpc_v1`, etc.)               | `qpc`         |
| `locale`              | Widget locale                                        | `en`          |
| `lp`                  | Minimal learning-plan mode (`true`/`false`)          | `false`       |
| `wbw`                 | Enable word-by-word translation (`true`/`false`)     | `false`       |
| `wbwTransliteration`  | Enable word-by-word transliteration (`true`/`false`) | `false`       |
| `width`               | Iframe width (CSS length)                            | `100%`        |
| `height`              | Iframe max height (CSS length)                       | Auto (script) |
| `showTranslationName` | Show translator names                                | `false`       |
| `showArabic`          | Show Arabic text                                     | `true`        |
| `tafsir`              | Show tafsirs button                                  | `true`        |
| `lessons`             | Show lessons button                                  | `true`        |
| `reflections`         | Show reflections button                              | `true`        |
| `answers`             | Show answers button                                  | `true`        |

Default values are omitted from generated embed URLs to keep iframe URLs clean. Invalid values are
ignored or clamped safely where possible. The `startWord` and `endWord` params control custom audio
playback ranges; they do not replace the prop-only text trimming API described below.

## Audio Segment Playback

The audio segment system is timestamp-based. The widget still uses one audio file URL for the
selected reciter and surah/range; it does not create or require physical audio slices. Segment
playback is modeled as an optional `audioSegment` object with `startTimeMs` and `endTimeMs`.

Existing default ayah playback is preserved. The runtime prefers valid `audioSegment` metadata when
it exists, then falls back to the legacy `audioStart` / `audioEnd` fields, which are seconds-based
and already used by the audio element. If `audioSegment` is missing or invalid, the widget should
continue using the legacy behavior.

### Audio modes

`ayah` is the default mode. It plays the full ayah or selected ayah range and preserves the existing
behavior. Generated default URLs omit `audioMode=ayah`.

`custom` plays a selected word range using `startWord` and `endWord`. Word indexes are zero-based,
and `endWord` is inclusive. Custom mode requires word timing data. If the needed timestamps are
missing or invalid, the resolver returns no custom segment and playback falls back safely.

`waqaf` plays a segment ending at a waqaf marker selected by the zero-based `waqaf` index. Waqaf
metadata is a helper signal only; it is not treated as absolute ayah boundary ground truth. Current
waqaf support uses MVP/sample Al-Baqarah marker metadata and can safely resolve to no segment when
marker data is unavailable.

### Word timestamps

QuranCDN timing tuples are converted into `WidgetWordTimestamp` records before they are exposed to
the widget runtime. Internal widget word indexes are zero-based. QuranCDN segment indexes are treated
as 1-based and converted once at the widget boundary.

Timing values are kept in milliseconds internally. Runtime playback converts millisecond segment
bounds into seconds before seeking the audio element.

### Repeat playback

`repeat=1` plays once. `repeat=3` plays three total passes of the same resolved segment. Repeat is
clamped to `1..20` both during query parsing and defensively in the runtime helper. Repeat state is
reset when the user pauses, starts replay from a stopped state, playback completes, or the widget
cleans up its event listeners.

### Active word highlighting

Active-word highlighting only runs when all of these are true:

- `wordHighlight=true`
- word timestamps exist
- matching word DOM elements exist

When active, the runtime adds `quran-widget-word--active` and `data-active-word="true"` to the
matching word element. This is intentionally conservative: it does not redesign Arabic rendering,
and it preserves mushaf font rendering and verse-end glyph handling.

### Builder audio segment controls

The builder shows segment controls only when audio is enabled:

- Audio mode dropdown: Full Ayah, Waqaf Segment, Custom Word Range
- Repeat count input, clamped to `1..20`
- Highlight active word toggle
- Custom start/end word index inputs, shown only in custom mode
- Waqaf index input, shown only in waqaf mode

The default preview URL stays clean: it should not include `audioMode=ayah`, `repeat=1`, or
`wordHighlight=false`.

## Prop-only trimming

The widget supports optional prop-based word trimming when rendering `QuranWidget` directly in
React. This is **not supported** through `/embed/v1` query parameters.

### Trim types

```ts
type WordTrimRange = {
  startWordIndex?: number;
  endWordIndex?: number;
};

type WidgetTrimOptions = {
  arabic?: WordTrimRange;
  translations?: Record<string, WordTrimRange>; // key = translation resource id
};
```

### Example usage

```tsx
<QuranWidget
  verses={verses}
  options={options}
  trim={{
    arabic: { startWordIndex: 2, endWordIndex: 8 },
    translations: {
      '131': { startWordIndex: 1, endWordIndex: 6 },
      '31': { startWordIndex: 0, endWordIndex: 4 },
    },
  }}
/>
```

### Rules

- Indexes are zero-based.
- `endWordIndex` is inclusive.
- If `startWordIndex` is missing, default is `0`.
- If `endWordIndex` is missing, default is the last word index (`words.length - 1`).
- Translation trimming is applied per selected translation ID.
- For Arabic, indexes are based on Arabic words only (the verse-end number marker is excluded from
  indexing). If the selected range includes the last Arabic word, the verse-end marker is kept.
- In verse range mode:
  - `startWordIndex` applies only to the first verse.
  - `endWordIndex` applies only to the last verse.

## Widget interactions

Client-side interactions are handled by `src/hooks/widget/useWidgetInteractions.ts`:

- **Copy**: Copies formatted text (Arabic + translation + URL) to clipboard
- **Share**: Copies the canonical quran.com verse URL to clipboard
- **Audio**: Toggle play/pause with time clamping for verse segments
- **Analytics**: Emits explicit interaction events: `embed_copy_text_clicked`,
  `embed_copy_link_clicked`, `embed_open_verse_clicked`, `embed_tafsirs_clicked`,
  `embed_lessons_clicked`, `embed_reflections_clicked`, `embed_answers_clicked`,
  `embed_audio_played`, `embed_audio_paused`, `embed_audio_ended`, `embed_word_clicked`,
  `embed_translation_clicked`, `embed_verse_block_clicked`, `embed_merged_translation_clicked`,
  `embed_merged_content_clicked`

Audio segment playback is implemented in the same interaction hook. It resolves playback bounds from
`audioSegment` first and uses legacy `audioStart` / `audioEnd` as fallback. Segment-specific
analytics events are emitted only when segment mode or repeat behavior is explicitly requested.

## Audio Segment QA

Use this checklist when validating timestamp-based audio segments. The widget should always use a
single audio URL with timestamp seeking; it should not require sliced audio files.

### Iframe URLs

Default existing behavior:

```text
/embed/v1?verses=2:1&audio=true&reciter=7
```

Custom segment:

```text
/embed/v1?verses=2:1&audio=true&reciter=7&audioMode=custom&startWord=0&endWord=2
```

Repeat:

```text
/embed/v1?verses=2:1&audio=true&reciter=7&repeat=3
```

Word highlight:

```text
/embed/v1?verses=2:1&audio=true&reciter=7&wordHighlight=true
```

Custom + repeat + highlight:

```text
/embed/v1?verses=2:1&audio=true&reciter=7&audioMode=custom&startWord=0&endWord=2&repeat=3&wordHighlight=true
```

Direct Al-Baqarah waqaf cut check:

```text
/embed/v1?verses=2:2&audio=true&reciter=7&audioMode=waqaf&waqaf=0
```

Direct Al-Baqarah waqaf repeat check:

```text
/embed/v1?verses=2:2&audio=true&reciter=7&audioMode=waqaf&waqaf=0&repeat=3
```

Direct Al-Baqarah custom segment check:

```text
/embed/v1?verses=2:2&audio=true&reciter=7&audioMode=custom&startWord=0&endWord=3
```

### Builder Checklist

- Open `/embed`.
- Treat `/embed` as the configuration builder. Direct audio cutting verification should use
  `/embed/v1` URLs such as `/embed/v1?verses=2:2&audio=true&reciter=7&audioMode=waqaf&waqaf=0`.
- Confirm the default preview iframe URL does not include `audioMode=ayah`, `repeat=1`, or
  `wordHighlight=false`.
- Change audio mode to Custom Word Range.
- Confirm custom start/end word inputs are visible in custom mode.
- Set start/end word indexes and confirm `startWord` and `endWord` appear in the preview URL.
- Set repeat to `3` and confirm `repeat=3`.
- Enable word highlight and confirm `wordHighlight=true`.
- Switch back to Full Ayah and confirm custom fields are hidden or ignored safely.
- Confirm existing controls still serialize correctly: audio toggle, reciter, range, WBW,
  translations, theme, mushaf, locale, and button toggles.

### Playback Checklist

- Default audio plays and clamps to the selected ayah/range.
- Custom segment seeks to the selected word range when timestamps are available.
- Repeat playback stops after the configured repeat count.
- Word highlighting appears only when `wordHighlight=true` and matching word timestamps exist.
- If segment metadata is missing or invalid, audio falls back to the legacy `audioStart`/`audioEnd`
  behavior.
- Waqaf mode should fail safely when no waqaf marker metadata is available; waqaf markers are helper
  metadata, not ayah boundary ground truth.
- Waqaf segment endings include a small post-roll padding and are clamped to the selected ayah end
  timestamp to avoid sharper-than-necessary MVP cuts.

## Testing audio segment behavior

Run the pure widget audio segment tests with a single thread in the Node environment:

```bash
pnpm exec vitest run src/components/AyahWidget/audio-segments.test.ts src/components/AyahWidget/queryParsing.test.ts src/components/AyahWidget/widget-embed.test.ts src/components/AyahWidget/widget-form.test.ts src/hooks/widget/widgetAudioPlayback.test.ts --environment=node --pool=threads --maxWorkers=1 --no-file-parallelism --reporter=dot
```

These flags avoid the Vitest fork worker timeout seen in the sandbox while still running the pure
feature tests. At the time this section was added:

- `git diff --check` passed.
- Targeted ESLint for the widget audio segment files passed.
- The command above passed with 5 test files and 34 tests.
- `pnpm exec tsc --noEmit --pretty false` still failed because of unrelated existing dirty
  xstate/waqaf files, not the widget audio segment feature.

The tests cover query parsing, embed URL serialization, QuranCDN timestamp conversion,
ayah/custom/waqaf segment resolution, playback-bound fallback, repeat clamping, active-word tracking
gates, and builder field visibility. Browser QA is still required for actual iframe audio playback.

## Limitations and future work

- Do not claim timestamp accuracy unless it has been measured against manual annotation.
- Waqaf marker data is MVP/sample-only for Al-Baqarah and is not a complete canonical data source.
- Browser QA is still needed for iframe audio playback, repeat behavior, and word highlighting.
- More localization labels may be needed beyond English.
- Future validation should start with Al-Baqarah 1-20 as the MVP scope, then Al-Baqarah 1-141 as
  the prototype scope, then full Al-Baqarah.
- Future alignment work should include a real forced-alignment pipeline, Quranic text
  normalization, and more qari support.

## Analytics queries

For ClickHouse query templates and coverage mapping, see:

- `docs/embed-widget-analytics-clickhouse.md`

## Fonts and mushaf system

Mushaf selection determines the Arabic font and verse-end glyph handling.

Key files:

- `src/components/AyahWidget/mushaf-fonts.ts`: maps mushaf to font families
- `src/components/AyahWidget/ArabicVerse.tsx`: renders Arabic + verse-end token
- `docs/font-rendering-system.md` and `docs/internal-font-rendering-guide.md`

Notes:

- For IndoPak, the verse-end glyphs come from the API text, not manual construction.
- The API uses 16-line mushaf for IndoPak to ensure glyphs exist.
- The verse-end glyph spans should use the same mushaf font family to render correctly.

## Localization

Widget labels are localized via `next-translate` in the embed page. The builder locale list is
derived from `i18n.json`. The header link text ("Read on Quran.com") uses
`embed:widget.readOnQuran`. Action labels include separate `reflections` and `lessons` keys.

If you add new labels:

- Add keys in translation JSONs
- Update `WidgetLabels` in `types/Embed.ts` if needed
- Ensure the embed page returns the new labels

## Adding a new widget option

Example: add a new "playButtonPosition".

1. Add the new field in `Preferences` inside `widget-types.ts`.
2. Add a default value in `INITIAL_PREFERENCES` in `widget-defaults.ts`.
3. If it is not a simple scalar, add it to `SPECIAL_PREFERENCE_KEYS` in `widget-config.ts`.
4. If it needs to be passed to the iframe, add it in `buildEmbedIframeSrc` in `widget-embed.ts`.
5. Add a UI field to `WIDGET_FIELDS` and place it in `WIDGET_FORM_BLOCKS` in `widget-form.ts`.
6. Update the embed page (`src/pages/embed/v1.tsx`) to parse and apply the new query param.
7. Update widget components to consume the option.
8. Add or update Playwright tests in `tests/integration/widget`.

## Testing

Tests live in `tests/integration/widget`. The helper `renderWidgetPage` in
`tests/integration/widget/widget-helper.ts` can render the widget in isolation.

Add tests for:

- Default behaviors
- Range behavior
- Locale changes
- Mushaf glyphs
- Copy and link behavior
- Error handling

## Debug tips

- Inspect the iframe `src` to confirm the right query params.
- Use `NEXT_PUBLIC_AYAH_WIDGET_ORIGIN` for local/testing if you need a custom origin.
- Check the browser console for clipboard or audio errors.
