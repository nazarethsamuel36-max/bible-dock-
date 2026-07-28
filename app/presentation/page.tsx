'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { renderVerseForPresentation, VerseSlide } from '../../lib/verseRenderer';

interface BibleVerseData {
  book: string;
  chapter: string;
  verse: string;
  text: string;
  reference: string;
  slideIndex?: number;
  totalSlides?: number;
}

function PresentationContent() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true'; // ?preview=true displays background
  const isBanner = searchParams.get('banner') === 'true'; // ?banner=true creates 30% height banner

  const [activeVerse, setActiveVerse] = useState<BibleVerseData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [renderedSlides, setRenderedSlides] = useState<VerseSlide[]>([]);
  const [isActive, setIsActive] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dynamic 16:9 scaler or banner mode (exact copy from WMB)
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Virtual design canvas dimensions
      const designWidth = 1920;
      const designHeight = 1080;
      const designLowerThirdHeight = 324;

      // Calculate scale factor based on viewport width
      const scale = w / designWidth;

      if (isBanner) {
        // Banner mode: 30% height, full width, positioned at bottom
        canvasRef.current.style.transform = 'none';
        canvasRef.current.style.left = '0';
        canvasRef.current.style.top = `${h * 0.7}px`;
        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = `${h * 0.3}px`;
      } else {
        // Responsive lower third: full width, scaled height
        const scaledHeight = designLowerThirdHeight * scale;
        canvasRef.current.style.transform = 'none';
        canvasRef.current.style.left = '0';
        canvasRef.current.style.top = `${h - scaledHeight}px`;
        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = `${scaledHeight}px`;

        // Apply scale to internal elements via CSS variable
        document.documentElement.style.setProperty('--viewport-scale', scale.toString());
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, [isBanner]);

  // Render verse when it changes
  useEffect(() => {
    if (activeVerse) {
      const scale = window.innerWidth / 1920;
      // Read font size from CSS variable
      const computedStyle = getComputedStyle(document.documentElement);
      const fontSizeStr = computedStyle.getPropertyValue('--quote-font-size').trim();
      const fontSize = fontSizeStr ? parseInt(fontSizeStr, 10) : 46;
      const lineHeightStr = computedStyle.getPropertyValue('--quote-line-height').trim();
      const lineHeight = lineHeightStr ? parseFloat(lineHeightStr) : 1;

      const result = renderVerseForPresentation(activeVerse.text, activeVerse.verse, fontSize, lineHeight, 'Crimson Text, serif', 1);
      setRenderedSlides(result.slides);
      // Use slideIndex if provided, otherwise default to 0
      setCurrentSlideIndex(activeVerse.slideIndex || 0);
      setIsActive(true);

      // Apply dynamic padding and scaled font size via CSS variables
      console.log('[Presentation] Applying dynamic values:', {
        dynamicPaddingTop: result.dynamicPaddingTop,
        dynamicPaddingBottom: result.dynamicPaddingBottom,
        scaledFontSize: result.scaledFontSize
      });
      document.documentElement.style.setProperty('--dynamic-padding-top', `${result.dynamicPaddingTop}px`);
      document.documentElement.style.setProperty('--dynamic-padding-bottom', `${result.dynamicPaddingBottom}px`);
      document.documentElement.style.setProperty('--quote-font-size', `${result.scaledFontSize}px`);

      // Verify the values were set
      console.log('[Presentation] CSS variables after setting:', {
        paddingTop: getComputedStyle(document.documentElement).getPropertyValue('--dynamic-padding-top'),
        paddingBottom: getComputedStyle(document.documentElement).getPropertyValue('--dynamic-padding-bottom'),
        fontSize: getComputedStyle(document.documentElement).getPropertyValue('--quote-font-size')
      });

      // Send slide info to control dock
      const channel = new BroadcastChannel('bible_presentation_channel');
      channel.postMessage({
        action: 'slideInfo',
        data: {
          totalSlides: result.slides.length,
          requiresSplitting: result.requiresSplitting,
          currentIndex: activeVerse.slideIndex || 0
        }
      });
      localStorage.setItem('biblePresentationCommand', JSON.stringify({
        action: 'slideInfo',
        data: {
          totalSlides: result.slides.length,
          requiresSplitting: result.requiresSplitting,
          currentIndex: activeVerse.slideIndex || 0
        }
      }));
      channel.close();
    }
  }, [activeVerse]);

  // BroadcastChannel and localStorage listeners for instant updates
  useEffect(() => {
    const handleCommand = (cmd: { action: string; data: any }) => {
      if (!cmd) return;

      switch (cmd.action) {
        case 'showVerse':
          setActiveVerse(cmd.data);
          break;
        case 'clearDisplay':
          setIsActive(false);
          setCurrentSlideIndex(0);
          setRenderedSlides([]);
          break;
        case 'nextSlide':
          if (renderedSlides.length > 1 && currentSlideIndex < renderedSlides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
            // Send slide change notification
            const channel = new BroadcastChannel('bible_presentation_channel');
            channel.postMessage({ 
              action: 'slideChanged', 
              data: { 
                index: currentSlideIndex + 1, 
                total: renderedSlides.length 
              } 
            });
            localStorage.setItem('biblePresentationCommand', JSON.stringify({ 
              action: 'slideChanged', 
              data: { 
                index: currentSlideIndex + 1, 
                total: renderedSlides.length 
              } 
            }));
            channel.close();
          }
          break;
        case 'prevSlide':
          if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
            // Send slide change notification
            const channel = new BroadcastChannel('bible_presentation_channel');
            channel.postMessage({ 
              action: 'slideChanged', 
              data: { 
                index: currentSlideIndex - 1, 
                total: renderedSlides.length 
              } 
            });
            localStorage.setItem('biblePresentationCommand', JSON.stringify({ 
              action: 'slideChanged', 
              data: { 
                index: currentSlideIndex - 1, 
                total: renderedSlides.length 
              } 
            }));
            channel.close();
          }
          break;
        default:
          break;
      }
    };

    // 1. BroadcastChannel listener
    const presentationChannel = new BroadcastChannel('bible_presentation_channel');
    presentationChannel.onmessage = (event) => {
      handleCommand(event.data);
    };

    // 2. LocalStorage storage event listener (fallback)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'biblePresentationCommand' && e.newValue) {
        try {
          const cmd = JSON.parse(e.newValue);
          handleCommand(cmd);
        } catch (err) {
          console.error('Failed to parse command from localStorage', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Read initial command state if present
    const initialCmd = localStorage.getItem('biblePresentationCommand');
    if (initialCmd) {
      try {
        const cmd = JSON.parse(initialCmd);
        handleCommand(cmd);
      } catch (e) {}
    }

    return () => {
      presentationChannel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Set the page background class
  useEffect(() => {
    document.body.className = 'overlay-body-transparent';
    return () => {
      document.body.className = '';
    };
  }, []);

  const reference = activeVerse ? `${activeVerse.book} ${activeVerse.chapter}:${activeVerse.verse}` : '';
  const currentSlide = renderedSlides[currentSlideIndex] || null;

  return (
    <div
      ref={canvasRef}
      className={`presentation-canvas-container ${isBanner ? 'banner-mode' : ''}`}
    >
      {/* Background Image (Rendered only if ?preview=true parameter is set, otherwise transparent for OBS keying) */}
      {isPreview && (
        <>
          <img
            className="presentation-bg-image"
            src="Screenshot 2026-07-21 215142.png"
            alt="Presentation background"
          />
          <div className="presentation-gradient-overlay" />
        </>
      )}

      {/* Lower Third presentation block */}
      <div className={`lower-third ${isActive ? 'active' : ''}`}>
        <div className="overlay-metadata-bar">
          <div className="overlay-year">{reference}</div>
          <div className="overlay-title"></div>
        </div>
        <div className="overlay-quote-container">
          <div className="overlay-quote-text">
            {activeVerse?.text.replace(/^["']|["']$/g, '')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PresentationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PresentationContent />
    </Suspense>
  );
}
