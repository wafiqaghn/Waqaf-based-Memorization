/**
 * QuranCDN word timing segment.
 *
 * The audio APIs return each word timing as:
 * [wordIndex, startTimeMs, endTimeMs]
 *
 * wordIndex is 1-indexed within the ayah. Keep the default `Segment`
 * alias for existing imports while using `QuranCDNSegment` in new code.
 */
export type QuranCDNSegment = [wordIndex: number, startTimeMs: number, endTimeMs: number];

type Segment = QuranCDNSegment;

export default Segment;
