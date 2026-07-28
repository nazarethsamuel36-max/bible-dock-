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
  scaledFontSize: number;
  dynamicPaddingTop: number;
  dynamicPaddingBottom: number;
}

/**
 * Calculate available text area in the presentation lower-third.
 * Canvas is 1920×1080.  Lower-third: 324 px.  Metadata bar: 56 px.
 * Available vertical space: 268px (324 - 56) for text + padding.
 * Font size is passed as parameter - only width scales with viewport.
 */
function getAvailableTextArea(scale: number = 1): {
  width: number;
  height: number;
} {
  const lowerThirdHeight = 324;
  const metadataHeight  = 56;
  const padH = 120;  // 60 left + 60 right

  return {
    width:  (1920 - padH) * scale,
    height: (lowerThirdHeight - metadataHeight), // Full vertical space for text + padding
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
 * Split a verse into slides with maximum lines based on available height.
 * If adding a word would exceed the available lines, move to next slide.
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
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const lineHeightPx = fontSize * lineHeight;
  const maxLinesPerSlide = Math.max(1, Math.floor(availableHeight / lineHeightPx));

  console.log('[VerseRenderer] Splitting logic:', {
    text: text.substring(0, 50) + '...',
    availableHeight: availableHeight.toFixed(2),
    fontSize: fontSize.toFixed(2),
    lineHeight: lineHeight,
    lineHeightPx: lineHeightPx.toFixed(2),
    maxLinesPerSlide,
    maxWidth: maxWidth.toFixed(2),
    totalWords: words.length,
    calculation: `${availableHeight.toFixed(2)} / ${lineHeightPx.toFixed(2)} = ${(availableHeight / lineHeightPx).toFixed(2)}`
  });

  if (words.length === 0) {
    return [{ text, verseNumber, slideNumber: 1, totalSlides: 1 }];
  }

  const slides: VerseSlide[] = [];
  let currentSlideWords: string[] = [];
  let currentSlideLines: string[] = [];

  for (const word of words) {
    // Try adding this word to current slide
    const testText = currentSlideWords.length > 0
      ? [...currentSlideWords, word].join(' ')
      : word;

    const testLines = wrapText(testText, maxWidth, fontSize, fontFamily);

    console.log('[VerseRenderer] Testing word:', word, {
      currentSlideWords: currentSlideWords.length,
      testLines: testLines.length,
      maxLines: maxLinesPerSlide,
      fits: testLines.length <= maxLinesPerSlide
    });

    if (testLines.length <= maxLinesPerSlide) {
      // Word fits on current slide
      currentSlideWords.push(word);
      currentSlideLines = testLines;
    } else {
      // Word doesn't fit, create new slide with current words
      console.log('[VerseRenderer] Creating new slide, current words:', currentSlideWords.length);
      if (currentSlideWords.length > 0) {
        slides.push({
          text: currentSlideWords.join(' '),
          verseNumber,
          slideNumber: slides.length + 1,
          totalSlides: 0,
        });
      }
      // Start new slide with this word
      currentSlideWords = [word];
      currentSlideLines = wrapText(word, maxWidth, fontSize, fontFamily);
    }
  }

  // Add final slide if it has content
  if (currentSlideWords.length > 0) {
    slides.push({
      text: currentSlideWords.join(' '),
      verseNumber,
      slideNumber: slides.length + 1,
      totalSlides: 0,
    });
  }

  // Update total slides count
  const totalSlides = slides.length;
  slides.forEach(slide => slide.totalSlides = totalSlides);

  console.log('[VerseRenderer] Final slides:', totalSlides, slides.map(s => ({ text: s.text.substring(0, 30) + '...', words: s.text.split(' ').length })));

  return slides;
}

/**
 * Main entry point.
 * Renders a verse into one or more slides that fit the presentation overlay.
 * Auto-scales font size if text doesn't fit, and calculates dynamic padding.
 */
export function renderVerseForPresentation(
  text:       string,
  verseNumber: string,
  fontSize:   number = 46,
  lineHeight: number = 1.5,
  fontFamily: string = 'Crimson Text, serif',
  scale:      number = 1,
): VerseRenderResult {
  const { width: maxWidth, height: totalAvailableHeight } = getAvailableTextArea(scale);
  const maxFontSize = 52;
  const minFontSize = 24;
  const minPadding = 1;

  // Auto-scale font size if text doesn't fit
  let scaledFontSize = Math.min(fontSize, maxFontSize);
  let fullHeight = measureTextHeight(text, scaledFontSize, fontFamily, lineHeight, maxWidth);

  while (fullHeight > (totalAvailableHeight - minPadding * 2) && scaledFontSize > minFontSize) {
    scaledFontSize -= 2;
    fullHeight = measureTextHeight(text, scaledFontSize, fontFamily, lineHeight, maxWidth);
  }

  // Calculate dynamic padding to center text
  // Use fixed small padding to prevent overflow
  const dynamicPadding = 1; // Fixed small padding
  const textAvailableHeight = totalAvailableHeight - dynamicPadding * 2;

  console.log('[VerseRenderer] Dynamic calculation:', {
    totalAvailableHeight,
    fullHeight,
    dynamicPadding,
    scaledFontSize,
    fontSize
  });

  if (fullHeight <= textAvailableHeight) {
    return {
      slides: [{ text, verseNumber, slideNumber: 1, totalSlides: 1 }],
      requiresSplitting: false,
      scaledFontSize,
      dynamicPaddingTop: dynamicPadding,
      dynamicPaddingBottom: dynamicPadding,
    };
  }

  const slides = splitVerseIntoSlides(
    text, verseNumber, textAvailableHeight, maxWidth, scaledFontSize, lineHeight, fontFamily,
  );

  return {
    slides,
    requiresSplitting: true,
    scaledFontSize,
    dynamicPaddingTop: dynamicPadding,
    dynamicPaddingBottom: dynamicPadding,
  };
}

/**
 * Quick check: does this verse require splitting at this font size?
 */
export function requiresVerseSplitting(
  text:       string,
  fontSize:   number = 46,
  lineHeight: number = 1.5,
  fontFamily: string = 'Crimson Text, serif',
): boolean {
  const { width: maxWidth, height: availableHeight } = getAvailableTextArea();
  return measureTextHeight(text, fontSize, fontFamily, lineHeight, maxWidth) > availableHeight;
}
