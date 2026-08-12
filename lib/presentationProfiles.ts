/**
 * Presentation Profiles — builds the PresentationFrame for a given target.
 *
 * The renderer is resolution-agnostic: it only ever receives a measured
 * PresentationFrame. This module decides *which* frame is built, so the
 * renderer never thinks "I render for 1920×1080" — it always thinks
 * "I render inside this rectangle."
 *
 *   • Preview profile — measures the live browser layout, so preview slides
 *     always match what the preview window shows.
 *   • OBS profile — simulates the overlay layout at the configured OBS Browser
 *     Source resolution and measures the resulting quote rectangle. The layout
 *     uses the real CSS design system (driven by --overlay-height-ratio and
 *     --presentation-vh), so a theme change is picked up automatically.
 *
 * The only difference between profiles is which frame is built — the renderer
 * pipeline (wrap → measure → fill → slides) is identical for every target.
 */

import type { PresentationFrame } from './verseRenderer';

export interface Resolution {
  width: number;
  height: number;
}

export const DEFAULT_OBS_RESOLUTION: Resolution = {
  width: 1920,
  height: 1080,
};

/**
 * Fallback used when DOM measurement is unavailable (SSR / pre-hydration).
 * Mirrors the design system at the default 1080p OBS resolution.
 */
const FALLBACK_FRAME: PresentationFrame = {
  quoteWidth: 1800, // 1920 - 120 (60px padding on each side)
  quoteHeight: 300,
  fontFamily: '"Times New Roman", serif',
  fontSize: 48,
  lineHeight: 1.2,
};

function parseLineHeightRatio(lineHeightStr: string | undefined, fontSize: number): number {
  if (!lineHeightStr) return FALLBACK_FRAME.lineHeight;
  if (lineHeightStr.endsWith('px')) {
    const pxVal = parseFloat(lineHeightStr);
    return fontSize > 0 ? pxVal / fontSize : FALLBACK_FRAME.lineHeight;
  }
  const val = parseFloat(lineHeightStr);
  if (isNaN(val)) return FALLBACK_FRAME.lineHeight;
  return val > 3 ? val / fontSize : val;
}

const hasDOM = typeof document !== 'undefined' && typeof getComputedStyle !== 'undefined';

// ─── Preview profile ────────────────────────────────────────────────────────

/**
 * Measures the frame from the live presentation layout.
 * Temporarily locked to fallback layout to ensure Dock/Audience unification.
 */
export function measurePreviewFrame(
  quoteTextEl: HTMLElement | null,
  quoteContainerEl: HTMLElement | null,
): PresentationFrame {
  return FALLBACK_FRAME;
}

// ─── OBS profile ────────────────────────────────────────────────────────────

/**
 * Builds the frame for a configured OBS Browser Source resolution.
 * Temporarily locked to fallback layout to ensure Dock/Audience unification.
 */
export function buildOBSFrame(
  resolution: Resolution = DEFAULT_OBS_RESOLUTION,
): PresentationFrame {
  return FALLBACK_FRAME;
}

/**
 * Constructs a hidden `.lower-third` overlay at the target resolution and
 * measures its quote box. --presentation-vh lets the CSS resolve vh-sized
 * values (30vh overlay) against the simulated viewport instead of the real
 * browser window.
 */
function measureOverlayAtResolution(resolution: Resolution): PresentationFrame {
  const root = document.createElement('div');
  root.style.cssText = `
    position: fixed;
    top: -100000px;
    left: -100000px;
    width: ${resolution.width}px;
    height: ${resolution.height}px;
    z-index: -1;
    visibility: hidden;
    pointer-events: none;
    overflow: hidden;
    background: transparent;
  `;
  root.style.setProperty('--presentation-vh', `${resolution.height}px`);
  root.innerHTML = `
    <div class="lower-third active">
      <div class="overlay-metadata-bar">
        <div class="overlay-year">REF</div>
        <div class="overlay-title"></div>
      </div>
      <div class="overlay-quote-container">
        <div class="overlay-quote-text">0</div>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  try {
    const quoteText = root.querySelector<HTMLElement>('.overlay-quote-text');
    const quoteContainer = root.querySelector<HTMLElement>('.overlay-quote-container');
    const cs = quoteText ? getComputedStyle(quoteText) : null;
    const cc = quoteContainer ? getComputedStyle(quoteContainer) : null;

    // clientWidth includes padding; the renderer wraps text in the content
    // box, so subtract the horizontal quote padding to get the real width.
    const padX =
      (parseFloat(cc?.paddingLeft || '0') || 0) +
      (parseFloat(cc?.paddingRight || '0') || 0);

    const fontSize = parseFloat(cs?.fontSize || '42') || FALLBACK_FRAME.fontSize;
    return {
      quoteWidth: Math.max(0, (quoteContainer?.clientWidth ?? resolution.width) - padX),
      quoteHeight: quoteContainer?.clientHeight ?? Math.round(resolution.height * 0.3) - 56,
      fontFamily: cs?.fontFamily || FALLBACK_FRAME.fontFamily,
      fontSize: fontSize,
      lineHeight: parseLineHeightRatio(cs?.lineHeight, fontSize),
    };
  } finally {
    root.remove();
  }
}
