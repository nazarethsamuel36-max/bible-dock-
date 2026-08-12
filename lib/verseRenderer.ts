/**
 * Bible Verse Slide Generation — DOM-Layout Engine
 *
 * The renderer is a deterministic pure function:
 *
 *   PresentationFrame + Verse text  →  VerseSlide[]
 *
 * The renderer has NO knowledge of any target resolution (no 1920×1080, no
 * fixed quote sizes). It always thinks: "I render inside this rectangle."
 *
 * The frame is built by a Presentation Profile (see lib/presentationProfiles.ts)
 * and describes the actual rendering rectangle at render time:
 *   • quoteWidth  — available text width in px
 *   • quoteHeight — maximum text height per slide in px
 *   • fontFamily / fontSize / lineHeight — fixed design system, never scaled
 *
 * Both quoteWidth and quoteHeight are measured from the real layout — never
 * assumed, never hardcoded. The renderer just fills whatever rectangle it is
 * given.
 *
 * Strategy: word-aware greedy line-packer measured against the real browser.
 *  - On the client we build a hidden element mirroring the quote box and read
 *    `el.scrollHeight` word-by-word.
 *  - If the font is not loaded yet we fall back to a character-width estimate.
 */

export interface PresentationFrame {
  /** Available text width in px — measured from the real quote container. */
  quoteWidth: number;
  /** Maximum text height per slide in px — measured from the real layout. */
  quoteHeight: number;
  /** Font family used by the quote text. */
  fontFamily: string;
  /** Font size in px. */
  fontSize: number;
  /** Unitless line-height. */
  lineHeight: number;
}

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
 * Creates a hidden DOM element whose CSS exactly mirrors the presentation
 * quote area.  The caller is responsible for removing it from the document.
 */
function createMeasurementElement(frame: PresentationFrame): HTMLDivElement {
  const el = document.createElement('div');

  // Position within layout flow but invisible to avoid skipped calculations
  el.style.position      = 'fixed';
  el.style.top           = '0';
  el.style.left          = '0';
  el.style.height        = 'auto';
  el.style.bottom        = 'auto';
  el.style.zIndex        = '-9999';
  el.style.overflow      = 'hidden';

  // Mirror the quote text box sizing
  el.style.width         = `${frame.quoteWidth}px`;
  el.style.fontFamily    = frame.fontFamily;
  el.style.fontSize      = `${frame.fontSize}px`;
  el.style.lineHeight    = `${frame.lineHeight}`;
  el.style.fontWeight    = 'normal';
  el.style.letterSpacing = 'normal';
  el.style.fontStyle     = 'normal';

  // Match wrapping rules
  el.style.whiteSpace    = 'normal';
  el.style.wordWrap      = 'break-word';
  el.style.overflowWrap  = 'break-word';

  // Zero out all box model extras
  el.style.padding       = '0';
  el.style.margin        = '0';
  el.style.border        = 'none';
  el.style.boxSizing     = 'border-box';

  // Make invisible but still laid-out
  el.style.visibility    = 'hidden';
  el.style.pointerEvents = 'none';
  el.style.userSelect    = 'none';

  return el;
}

/**
 * DOM-based word-by-word slide builder (client only).
 *
 * For every word in the verse:
 *   1. Tentatively append it to the current slide buffer.
 *   2. Ask the browser for the rendered height (el.scrollHeight).
 *   3. If the height still fits within frame.quoteHeight, keep the word.
 *   4. If it overflows, close the current slide and open a new one.
 *
 * This is 100% browser-truth — no canvas, no estimation, no character math.
 */
function remoteLog(message: string) {
  console.info(message);
}

export function renderVerseWithDOMLayout(
  text: string,
  verseNumber: string,
  frame: PresentationFrame,
): VerseRenderResult {
  if (typeof document === 'undefined') {
    // Server-side static generation: fall back to estimation
    return estimateSplit(text, verseNumber, frame);
  }

  // Check if the primary family is loaded; if not, estimation is more
  // reliable than measuring with a wrong fallback font.
  const primaryFamily = frame.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
  const fontReady =
    document.fonts &&
    document.fonts.check(`${frame.fontSize}px "${primaryFamily}"`);

  if (!fontReady) {
    return estimateSplit(text, verseNumber, frame);
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return singleSlide(text, verseNumber);
  }

  const el = createMeasurementElement(frame);
  document.body.appendChild(el);

  const maxHeight   = frame.quoteHeight;
  const slideTexts: string[] = [];
  let   buffer: string[] = [];

  remoteLog(`Frame
------
Width: ${frame.quoteWidth}px
Height: ${maxHeight}px

Verse
------
${verseNumber || 'Text'}`);

  let iteration = 0;

  for (const word of words) {
    iteration++;
    const candidate = buffer.length > 0
      ? `${buffer.join(' ')} ${word}`
      : word;

    el.textContent = candidate;
    const h = el.scrollHeight;

    const fits = h <= maxHeight || buffer.length === 0;

    remoteLog(`Iteration ${iteration}
-----------
Candidate Height: ${h}px
Status: ${fits ? 'Fits' : 'Overflow'}`);

    if (!fits) {
      const currentWordIndex = words.indexOf(word, iteration - 1);
      const remaining = words.slice(currentWordIndex).join(' ');

      remoteLog(`Action:
Finalize Slide ${slideTexts.length + 1}

Remaining Words:
"${remaining}"`);

      // This word causes the slide to overflow → commit current buffer
      slideTexts.push(buffer.join(' '));
      buffer = [word];
    } else {
      // Word fits
      buffer = candidate.split(' ');
    }
  }

  // Commit the last buffer
  if (buffer.length > 0) {
    remoteLog(`Action:
Finalize Slide ${slideTexts.length + 1}`);
    slideTexts.push(buffer.join(' '));
  }

  remoteLog(`\nSlides Generated: ${slideTexts.length}\n`);
  slideTexts.forEach((slide, i) => {
    const wordCount = slide.split(/\s+/).length;
    remoteLog(`Slide ${i + 1}
--------
${wordCount} words`);
  });

  document.body.removeChild(el);

  return buildResult(slideTexts, verseNumber);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function singleSlide(text: string, verseNumber: string): VerseRenderResult {
  return {
    slides: [{ text, verseNumber, slideNumber: 1, totalSlides: 1 }],
    requiresSplitting: false,
  };
}

function buildResult(slideTexts: string[], verseNumber: string): VerseRenderResult {
  const total = slideTexts.length;
  const slides: VerseSlide[] = slideTexts.map((text, i) => ({
    text,
    verseNumber,
    slideNumber: i + 1,
    totalSlides: total,
  }));
  return { slides, requiresSplitting: total > 1 };
}

/**
 * Server-side / font-not-loaded estimation.
 * Word-aware, never cuts mid-word.
 * Uses 0.5 × fontSize as an average character width (conservative for Crimson Text).
 * For Devanagari-heavy text uses 0.6 × fontSize.
 */
function estimateSplit(
  text: string,
  verseNumber: string,
  frame: PresentationFrame,
): VerseRenderResult {
  const devanagariRatio =
    ((text.match(/[\u0900-\u097F]/g) || []).length) /
    Math.max(1, text.replace(/\s/g, '').length);
  const avgCharWidth = frame.fontSize * (devanagariRatio > 0.3 ? 0.6 : 0.5);
  const charsPerLine = Math.max(1, Math.floor(frame.quoteWidth / avgCharWidth));
  const maxLines     = Math.max(1, Math.floor(frame.quoteHeight / (frame.fontSize * frame.lineHeight)));

  const words    = text.trim().split(/\s+/);
  const lines: string[] = [];
  let   line     = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > charsPerLine) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  const totalSlides = Math.ceil(lines.length / maxLines);
  if (totalSlides <= 1) return singleSlide(text, verseNumber);

  const slideTexts: string[] = [];
  for (let i = 0; i < totalSlides; i++) {
    slideTexts.push(lines.slice(i * maxLines, (i + 1) * maxLines).join(' '));
  }
  return buildResult(slideTexts, verseNumber);
}

/**
 * Quick estimate: does this verse require splitting at this frame?
 */
export function requiresVerseSplitting(
  text: string,
  frame: PresentationFrame,
): boolean {
  const avgCharWidth = frame.fontSize * 0.5;
  const charsPerLine = Math.max(1, Math.floor(frame.quoteWidth / avgCharWidth));
  const maxLines     = Math.max(1, Math.floor(frame.quoteHeight / (frame.fontSize * frame.lineHeight)));
  const words = text.trim().split(/\s+/);
  let lines = 1, len = 0;
  for (const w of words) {
    if (len > 0 && len + w.length + 1 > charsPerLine) { lines++; len = w.length; }
    else len += (len > 0 ? 1 : 0) + w.length;
  }
  return lines > maxLines;
}
