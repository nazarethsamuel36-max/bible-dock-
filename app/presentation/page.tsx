'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { renderVerseForPresentation, VerseSlide } from '../../lib/verseRenderer';

interface BibleVerseData {
  book: string;
  chapter: string;
  verse: string;
  text: string;
  reference: string;
  slideIndex?: number;
}

export default function PresentationPage() {
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

      if (isBanner) {
        // Banner mode: 30% height, full width, positioned at bottom
        canvasRef.current.style.transform = 'none';
        canvasRef.current.style.left = '0';
        canvasRef.current.style.top = `${h * 0.7}px`; // 30% from top (70% down)
        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = `${h * 0.3}px`;
      } else {
        // 16:9 mode with proportional margins
        const marginPercent = 0.05; // 5% margin on all sides
        const availableW = w * (1 - marginPercent * 2);
        const availableH = h * (1 - marginPercent * 2);
        const scale = Math.min(availableW / 1920, availableH / 1080);
        canvasRef.current.style.transform = `scale(${scale})`;
        canvasRef.current.style.left = `${(w - 1920 * scale) / 2}px`;
        canvasRef.current.style.top = `${(h - 1080 * scale) / 2}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, [isBanner]);

  // Render verse when it changes
  useEffect(() => {
    if (activeVerse) {
      const result = renderVerseForPresentation(activeVerse.text, activeVerse.verse);
      setRenderedSlides(result.slides);
      // Use slideIndex if provided, otherwise default to 0
      setCurrentSlideIndex(activeVerse.slideIndex || 0);
      setIsActive(true);
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
          {renderedSlides.length > 1 && (
            <div className="overlay-para">{currentSlideIndex + 1}/{renderedSlides.length}</div>
          )}
        </div>
        <div className="overlay-quote-container">
          <div className="overlay-quote-text">
            {currentSlide?.text}
          </div>
        </div>
      </div>
    </div>
  );
}
