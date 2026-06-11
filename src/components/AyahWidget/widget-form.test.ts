/* eslint-disable react-func/max-lines-per-function */
import { describe, expect, it } from 'vitest';

import { INITIAL_PREFERENCES } from './widget-defaults';
import { buildEmbedIframeSrc } from './widget-embed';
import { WIDGET_FIELDS, WIDGET_FORM_BLOCKS, type WidgetFormContext } from './widget-form';

const emptyContext = {} as WidgetFormContext;

describe('widget audio segment form fields', () => {
  it('keeps default audio segment params out of default embed URLs', () => {
    const src = buildEmbedIframeSrc(INITIAL_PREFERENCES, '', { omitDefaults: true });
    const params = new URL(src).searchParams;

    expect(params.has('audioMode')).toBe(false);
    expect(params.has('startWord')).toBe(false);
    expect(params.has('endWord')).toBe(false);
    expect(params.has('waqaf')).toBe(false);
    expect(params.has('repeat')).toBe(false);
    expect(params.has('wordHighlight')).toBe(false);
  });

  it('adds audio segment controls to the builder form blocks', () => {
    const formFieldIds = WIDGET_FORM_BLOCKS.flatMap((block) => {
      if (block.kind === 'field') return [block.field.id];
      if (block.kind === 'twoColumn') return block.fields.map((field) => field.id);
      return [];
    });

    expect(formFieldIds).toEqual(
      expect.arrayContaining([
        'audioMode',
        'repeatCount',
        'enableWordHighlight',
        'startWordIndex',
        'endWordIndex',
        'waqafIndex',
      ]),
    );
  });

  it('shows custom word fields only in custom audio mode', () => {
    expect(
      WIDGET_FIELDS.startWordIndex.isVisible?.(
        { ...INITIAL_PREFERENCES, audioMode: 'ayah' },
        emptyContext,
      ),
    ).toBe(false);
    expect(
      WIDGET_FIELDS.startWordIndex.isVisible?.(
        { ...INITIAL_PREFERENCES, audioMode: 'custom' },
        emptyContext,
      ),
    ).toBe(true);
  });

  it('shows waqaf index only in waqaf audio mode', () => {
    expect(
      WIDGET_FIELDS.waqafIndex.isVisible?.(
        { ...INITIAL_PREFERENCES, audioMode: 'custom' },
        emptyContext,
      ),
    ).toBe(false);
    expect(
      WIDGET_FIELDS.waqafIndex.isVisible?.(
        { ...INITIAL_PREFERENCES, audioMode: 'waqaf' },
        emptyContext,
      ),
    ).toBe(true);
  });

  it('normalizes repeat and optional word index values', () => {
    expect(
      WIDGET_FIELDS.repeatCount.setValue?.('999', INITIAL_PREFERENCES, emptyContext),
    ).toMatchObject({
      repeatCount: 20,
    });
    expect(
      WIDGET_FIELDS.startWordIndex.setValue?.('', INITIAL_PREFERENCES, emptyContext),
    ).toMatchObject({
      startWordIndex: undefined,
    });
  });
});
