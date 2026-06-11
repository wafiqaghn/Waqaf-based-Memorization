import { describe, expect, it } from 'vitest';

import { parseBool, parseClampedInteger, parseWidgetAudioMode } from './queryParsing';
import { MAX_AUDIO_REPEAT_COUNT } from './widget-defaults';

describe('queryParsing audio segment params', () => {
  it('parses supported audio modes', () => {
    expect(parseWidgetAudioMode('ayah')).toBe('ayah');
    expect(parseWidgetAudioMode('waqaf')).toBe('waqaf');
    expect(parseWidgetAudioMode('custom')).toBe('custom');
  });

  it('returns undefined for unsupported audio modes', () => {
    expect(parseWidgetAudioMode('loop')).toBeUndefined();
    expect(parseWidgetAudioMode(undefined)).toBeUndefined();
  });

  it('parses and clamps repeat counts', () => {
    expect(parseClampedInteger('0', 1, MAX_AUDIO_REPEAT_COUNT)).toBe(1);
    expect(parseClampedInteger('3', 1, MAX_AUDIO_REPEAT_COUNT)).toBe(3);
    expect(parseClampedInteger('999', 1, MAX_AUDIO_REPEAT_COUNT)).toBe(20);
  });

  it('parses zero-based word and waqaf indexes safely', () => {
    expect(parseClampedInteger('0', 0)).toBe(0);
    expect(parseClampedInteger('5', 0)).toBe(5);
    expect(parseClampedInteger('-2', 0)).toBe(0);
  });

  it('ignores non-integer values', () => {
    expect(parseClampedInteger('abc', 0)).toBeUndefined();
    expect(parseClampedInteger('2.5', 0)).toBeUndefined();
  });

  it('parses explicit word highlight booleans', () => {
    expect(parseBool('true', false)).toBe(true);
    expect(parseBool('false', true)).toBe(false);
  });
});
