/**
 * Bible Verse Rendering Utility
 * Handles text measurement and intelligent verse splitting for presentation.
 *
 * Strategy: use a word-aware greedy line-packer.
 * - On the client we try canvas measureText with a sanity check.
 * - If the font is not loaded yet (canvas returns suspiciously small widths)
 *   we fall back to the character-width estimate.
 * - On the server we always use the character-width estimate.
 * - Hindi (Devanagari) text is detected and given a slightly wider multiplier
 *   because Devanagari glyphs + matras are wider than Latin glyphs at the
 *   same font-size.
 */

export interface VerseSlide {
  text: string;
  verseNumber: string;
  slideNumber: number;
  totalSlides: number;
}

export interface VerseRenderResult {
  slides: VerseSlide[];
  requiresSplitting: boolean;
}

/**
 * Calculate available text area in the presentation lower-third.
 * Canvas is 1920×1080.  Lower-third: 324 px.  Metadata bar: 56 px.
 * Padding: 10 top / 10 bottom / 60 left / 60 right.
 */
function getAvailableTextArea(): {
  width: number;
  height: number;
} {
  const lowerThirdHeight = 324;
  const metadataHeight  = 56;
  const padV = 20;   // 10 top + 10 bottom
  const padH = 120;  // 60 left + 60 right

  return {
    width:  1920 - padH,
    height: lowerThirdHeight - metadataHeight - padV,
  };
}

/**
 * Detect whether text is predominantly Hindi/Devanagari.
 * Returns a per-character average-width multiplier relative to fontSize.
 * Latin  Crimson Text at 69 px: a typical character is ~0.52 × fontSize.
 * Devanagari (system fallback)  is ~0.65 × fontSize (wider, with matras).
 */
function charWidthMultiplier(text: string): number {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  const nonSpace   = text.replace(/\s/g, '').length || 1;
  return devanagari / nonSpace > 0.3 ? 0.65 : 0.52;
}

/**
 * Build a measure function.
 * On the client we attempt canvas, but sanity-check the result.
 * If the font gives implausibly small widths (not loaded yet), we fall back.
 */
function buildMeasureFn(
  text:       string,
  fontSize:   number,
  fontFamily: string,
): (segment: string) => number {
  const mult = charWidthMultiplier(text);
  const approx = (t: string) =>
    t.replace(/\s/g, '').length * fontSize * mult +
    Math.max(0, t.split(' ').length - 1) * fontSize * 0.25;

  if (typeof document === 'undefined') return approx;

  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');
  if (!ctx) return approx;

  ctx.font = `${fontSize}px ${fontFamily}`;

  // Sanity-check: 'W' in a properly-loaded 69 px font should be > 30 px.
  const wWidth = ctx.measureText('W').width;
  if (wWidth < fontSize * 0.25 || wWidth > fontSize * 1.5) return approx;

  return (t: string) => ctx.measureText(t).width;
}

/**
 * Word-aware text wrapper.  Splits ONLY at spaces — never mid-word,
 * never at punctuation boundaries.  Works on both server and client.
 */
function wrapText(
  text:       string,
  maxWidth:   number,
  fontSize:   number,
  fontFamily: string,
): string[] {
  // Normalise whitespace; split into words
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [text];

  const measure = buildMeasureFn(text, fontSize, fontFamily);
  const lines: string[] = [];
  let   current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measure(candidate) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  return lines.length > 0 ? lines : [text];
}

/**
 * Measure the total pixel height the text will occupy when wrapped.
 */
function measureTextHeight(
  text:       string,
  fontSize:   number,
  fontFamily: string,
  lineHeight: number,
  maxWidth:   number,
): number {
  const lines = wrapText(text, maxWidth, fontSize, fontFamily);
  return lines.length * fontSize * lineHeight;
}

/**
 * Split a verse into slides so that each slide holds at most
 * `maxLinesPerSlide` wrapped lines.  Every slide is filled to capacity
 * before a new one is opened.
 */
function splitVerseIntoSlides(
  text:            string,
  verseNumber:     string,
  availableHeight: number,
  maxWidth:        number,
  fontSize:        number,
  lineHeight:      number,
  fontFamily:      string,
): VerseSlide[] {
  const lines            = wrapText(text, maxWidth, fontSize, fontFamily);
  const lineHeightPx     = fontSize * lineHeight;
  const maxLinesPerSlide = Math.max(1, Math.floor(availableHeight / lineHeightPx));

  if (lines.length <= maxLinesPerSlide) {
    return [{ text, verseNumber, slideNumber: 1, totalSlides: 1 }];
  }

  const slides: VerseSlide[] = [];
  const totalSlides = Math.ceil(lines.length / maxLinesPerSlide);

  for (let i = 0; i < totalSlides; i++) {
    const start      = i * maxLinesPerSlide;
    const end        = Math.min(start + maxLinesPerSlide, lines.length);
    const slideText  = lines.slice(start, end).join(' ');
    slides.push({
      text: slideText,
      verseNumber,
      slideNumber:  i + 1,
      totalSlides,
    });
  }

  return slides;
}

/**
 * Main entry point.
 * Renders a verse into one or more slides that fit the presentation overlay.
 */
export function renderVerseForPresentation(
  text:       string,
  verseNumber: string,
  fontSize:   number = 69,
  lineHeight: number = 1.5,
  fontFamily: string = 'Crimson Text, serif',
): VerseRenderResult {
  const { width: maxWidth, height: availableHeight } = getAvailableTextArea();
  const fullHeight = measureTextHeight(text, fontSize, fontFamily, lineHeight, maxWidth);

  if (fullHeight <= availableHeight) {
    return {
      slides: [{ text, verseNumber, slideNumber: 1, totalSlides: 1 }],
      requiresSplitting: false,
    };
  }

  const slides = splitVerseIntoSlides(
    text, verseNumber, availableHeight, maxWidth, fontSize, lineHeight, fontFamily,
  );

  return { slides, requiresSplitting: true };
}

/**
 * Quick check: does this verse require splitting at this font size?
 */
export function requiresVerseSplitting(
  text:       string,
  fontSize:   number = 69,
  lineHeight: number = 1.5,
  fontFamily: string = 'Crimson Text, serif',
): boolean {
  const { width: maxWidth, height: availableHeight } = getAvailableTextArea();
  return measureTextHeight(text, fontSize, fontFamily, lineHeight, maxWidth) > availableHeight;
}
