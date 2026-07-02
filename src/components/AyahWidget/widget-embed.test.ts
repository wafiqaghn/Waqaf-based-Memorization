/* eslint-disable react-func/max-lines-per-function */
import { describe, expect, it } from 'vitest';

import { DEFAULTS, INITIAL_PREFERENCES } from './widget-defaults';
import { buildEmbedIframeSrc, buildEmbedSnippet } from './widget-embed';

describe('buildEmbedSnippet', () => {
  it('includes the resizer script and iframe data attribute', () => {
    const snippet = buildEmbedSnippet(INITIAL_PREFERENCES, '');

    expect(snippet).toContain('data-quran-embed="true"');
    expect(snippet).toContain('widget/embed-widget.js');
    expect(snippet).toContain('<script');
  });

  it('omits height constraints when height is empty', () => {
    const snippet = buildEmbedSnippet(INITIAL_PREFERENCES, '');

    expect(snippet).not.toContain('data-quran-embed-max-height');
    expect(snippet).not.toContain('\n  height="');
  });

  it('adds max height when a height value is provided', () => {
    const snippet = buildEmbedSnippet(
      {
        ...INITIAL_PREFERENCES,
        customSize: { ...INITIAL_PREFERENCES.customSize, height: '420px' },
      },
      '',
    );

    expect(snippet).toContain('data-quran-embed-max-height="420px"');
    expect(snippet).toContain('\n  height="420px"');
  });

  it('omits the default clientId from the embed snippet', () => {
    const preferences = {
      ...INITIAL_PREFERENCES,
      clientId: DEFAULTS.clientId,
    };

    const snippet = buildEmbedSnippet(preferences, String(DEFAULTS.translationId));

    expect(snippet).not.toContain('clientId=');
  });

  it('includes custom clientId in the embed snippet', () => {
    const preferences = {
      ...INITIAL_PREFERENCES,
      clientId: 'Example Site',
    };

    const snippet = buildEmbedSnippet(preferences, String(DEFAULTS.translationId));

    expect(snippet).toContain('clientId=Example+Site');
  });

  it('does not include default audio segment params in a default embed URL', () => {
    const src = buildEmbedIframeSrc(INITIAL_PREFERENCES, '', { omitDefaults: true });
    const params = new URL(src).searchParams;

    expect(params.has('audioMode')).toBe(false);
    expect(params.has('startWord')).toBe(false);
    expect(params.has('endWord')).toBe(false);
    expect(params.has('waqaf')).toBe(false);
    expect(params.has('repeat')).toBe(false);
    expect(params.has('wordHighlight')).toBe(false);
  });

  it('serializes custom audio segment params when provided', () => {
    const src = buildEmbedIframeSrc(
      {
        ...INITIAL_PREFERENCES,
        audioMode: 'custom',
        startWordIndex: 2,
        endWordIndex: 8,
        repeatCount: 3,
        enableWordHighlight: true,
      },
      '',
      { omitDefaults: true },
    );
    const params = new URL(src).searchParams;

    expect(params.get('audioMode')).toBe('custom');
    expect(params.get('startWord')).toBe('2');
    expect(params.get('endWord')).toBe('8');
    expect(params.get('repeat')).toBe('3');
    expect(params.get('wordHighlight')).toBe('true');
  });

  it('serializes waqaf audio segment params when provided', () => {
    const src = buildEmbedIframeSrc(
      {
        ...INITIAL_PREFERENCES,
        audioMode: 'waqaf',
        waqafIndex: 0,
      },
      '',
      { omitDefaults: true },
    );
    const params = new URL(src).searchParams;

    expect(params.get('audioMode')).toBe('waqaf');
    expect(params.get('waqaf')).toBe('0');
  });

  it('omits repeat when it is default or lower and clamps high repeat counts', () => {
    const defaultRepeatSrc = buildEmbedIframeSrc({ ...INITIAL_PREFERENCES, repeatCount: 1 }, '', {
      omitDefaults: true,
    });
    const lowRepeatSrc = buildEmbedIframeSrc({ ...INITIAL_PREFERENCES, repeatCount: 0 }, '', {
      omitDefaults: true,
    });
    const highRepeatSrc = buildEmbedIframeSrc({ ...INITIAL_PREFERENCES, repeatCount: 999 }, '', {
      omitDefaults: true,
    });

    expect(new URL(defaultRepeatSrc).searchParams.has('repeat')).toBe(false);
    expect(new URL(lowRepeatSrc).searchParams.has('repeat')).toBe(false);
    expect(new URL(highRepeatSrc).searchParams.get('repeat')).toBe('20');
  });
});
