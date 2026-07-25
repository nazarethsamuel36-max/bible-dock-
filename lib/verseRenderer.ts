/**
 * Bible Verse Rendering Utility
 * Handles text measurement and intelligent verse splitting for presentation
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
 * Calculate available text area in the presentation lower-third
 * Lower-third is ~30% of screen height (324px out of 1080px)
 */
function getAvailableTextArea(): {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
} {
  // Presentation canvas is 1920x1080
  // Lower-third height is 324px
  // Metadata bar height is 56px
  // Padding: top 10px, right 60px, bottom 10px, left 60px
  
  const metadataHeight = 56;
  const padding = { top: 10, right: 60, bottom: 10, left: 60 };
  const lowerThirdHeight = 324;
  
  const availableHeight = lowerThirdHeight - metadataHeight - padding.top - padding.bottom;
  const availableWidth = 1920 - padding.left - padding.right;
  
  return {
    width: availableWidth,
    height: availableHeight,
    padding
  };
}

/**
 * Measure text height using canvas
 */
function measureTextHeight(
  text: string,
  fontSize: number = 42,
  fontFamily: string = 'Crimson Text, serif',
  lineHeight: number = 1.5,
  maxWidth: number
): number {
  if (typeof document === 'undefined') {
    // Server-side fallback: estimate based on character count
    const avgCharWidth = fontSize * 0.6; // Approximate
    const charsPerLine = Math.floor(maxWidth / avgCharWidth);
    const lines = Math.ceil(text.length / charsPerLine);
    return lines * fontSize * lineHeight;
  }
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    // Fallback
    const avgCharWidth = fontSize * 0.6;
    const charsPerLine = Math.floor(maxWidth / avgCharWidth);
    const lines = Math.ceil(text.length / charsPerLine);
    return lines * fontSize * lineHeight;
  }
  
  context.font = `${fontSize}px ${fontFamily}`;
  
  // Wrap text
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = context.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length * fontSize * lineHeight;
}

/**
 * Wrap text to fit within maxWidth
 */
function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number = 42,
  fontFamily: string = 'Crimson Text, serif'
): string[] {
  if (typeof document === 'undefined') {
    // Server-side fallback
    const avgCharWidth = fontSize * 0.6;
    const charsPerLine = Math.floor(maxWidth / avgCharWidth);
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += charsPerLine) {
      lines.push(text.slice(i, i + charsPerLine));
    }
    return lines;
  }
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    const avgCharWidth = fontSize * 0.6;
    const charsPerLine = Math.floor(maxWidth / avgCharWidth);
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += charsPerLine) {
      lines.push(text.slice(i, i + charsPerLine));
    }
    return lines;
  }
  
  context.font = `${fontSize}px ${fontFamily}`;
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = context.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Split verse into multiple slides at natural boundaries
 */
function splitVerseIntoSlides(
  text: string,
  verseNumber: string,
  availableHeight: number,
  maxWidth: number,
  fontSize: number = 42,
  lineHeight: number = 1.5,
  fontFamily: string = 'Crimson Text, serif'
): VerseSlide[] {
  const lines = wrapText(text, maxWidth, fontSize, fontFamily);
  const lineHeightPx = fontSize * lineHeight;
  const maxLinesPerSlide = Math.floor(availableHeight / lineHeightPx);
  
  if (lines.length <= maxLinesPerSlide) {
    // Fits in one slide
    return [{
      text: text,
      verseNumber,
      slideNumber: 1,
      totalSlides: 1
    }];
  }
  
  // Split into multiple slides
  const slides: VerseSlide[] = [];
  const totalSlides = Math.ceil(lines.length / maxLinesPerSlide);
  
  for (let i = 0; i < totalSlides; i++) {
    const startLine = i * maxLinesPerSlide;
    const endLine = Math.min((i + 1) * maxLinesPerSlide, lines.length);
    const slideLines = lines.slice(startLine, endLine);
    
    slides.push({
      text: slideLines.join(' '),
      verseNumber,
      slideNumber: i + 1,
      totalSlides
    });
  }
  
  return slides;
}

/**
 * Main function to render a verse for presentation
 */
export function renderVerseForPresentation(
  text: string,
  verseNumber: string,
  fontSize: number = 42,
  lineHeight: number = 1.5,
  fontFamily: string = 'Crimson Text, serif'
): VerseRenderResult {
  const { width: maxWidth, height: availableHeight } = getAvailableTextArea();
  
  // Measure the full verse
  const fullHeight = measureTextHeight(text, fontSize, fontFamily, lineHeight, maxWidth);
  
  if (fullHeight <= availableHeight) {
    // Fits in one slide
    return {
      slides: [{
        text,
        verseNumber,
        slideNumber: 1,
        totalSlides: 1
      }],
      requiresSplitting: false
    };
  }
  
  // Need to split
  const slides = splitVerseIntoSlides(
    text,
    verseNumber,
    availableHeight,
    maxWidth,
    fontSize,
    lineHeight,
    fontFamily
  );
  
  return {
    slides,
    requiresSplitting: true
  };
}

/**
 * Check if a verse requires splitting (without generating slides)
 */
export function requiresVerseSplitting(
  text: string,
  fontSize: number = 42,
  lineHeight: number = 1.5,
  fontFamily: string = 'Crimson Text, serif'
): boolean {
  const { width: maxWidth, height: availableHeight } = getAvailableTextArea();
  const fullHeight = measureTextHeight(text, fontSize, fontFamily, lineHeight, maxWidth);
  return fullHeight > availableHeight;
}
