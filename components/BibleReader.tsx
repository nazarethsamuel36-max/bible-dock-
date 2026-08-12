'use client';

import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { useBible, splitVerseToSlides } from '../context/BibleContext';
import { addToBibleSetlist } from './BibleSetlist';

export const BibleReader: React.FC = () => {
  const { state, setLanguage, setLocation, setReadingVerse, setReadingSlide, toggleLiveVerse, setPresentationSlide } = useBible();
  const { bibleFull, bibleIndex, language, currentBook, currentChapter, currentVerse, readingVerseIndex, readingSlideIndex, liveVerseIndex, presentationSlideIndex, presentationTotalSlides, justNavigatedFromSearch } = state;
  
  const contentRef = useRef<HTMLDivElement>(null);

  const currentBookData = useMemo(() => {
    if (!bibleFull || !currentBook) return null;
    const bookKey = language === 'en' ? currentBook : (bibleIndex?.[currentBook]?.hi || currentBook);
    return bibleFull[language]?.[bookKey];
  }, [bibleFull, bibleIndex, currentBook, language]);

  const currentChapterData = useMemo(() => {
    if (!currentBookData || !currentChapter) return null;
    return currentBookData.chapters[currentChapter];
  }, [currentBookData, currentChapter]);

  // Flatten verses with slide information like WMB
  const displayItems = useMemo(() => {
    if (!currentChapterData) return [];
    
    const items: Array<{
      verseIndex: number;
      slideIndex: number;
      verseNum: string;
      text: string;
      slideNumber: number;
      totalSlides: number;
    }> = [];

    Object.entries(currentChapterData).forEach(([verseNum, text], verseIndex) => {
      const slides = splitVerseToSlides(text);
      
      slides.forEach((slideText, slideIndex) => {
        items.push({
          verseIndex,
          slideIndex,
          verseNum,
          text: slideText,
          slideNumber: slideIndex + 1,
          totalSlides: slides.length
        });
      });
    });

    // ── DIAGNOSTIC LOG ── remove after debugging ─────────────────────────────
    const fontReady = typeof document !== 'undefined' && document.fonts
      ? document.fonts.check('42px "Crimson Text"')
      : false;
    console.log('[BibleReader] Font ready:', fontReady);
    console.log('[BibleReader] displayItems for verse 1:', JSON.stringify(
      items.filter(i => i.verseNum === '1').map(i => ({
        verse: i.verseNum,
        slide: i.slideNumber,
        totalSlides: i.totalSlides,
        text: i.text.slice(0, 60) + (i.text.length > 60 ? '...' : ''),
      })),
      null, 2
    ));
    console.log('[BibleReader] Total cards in DOM:', items.length);
    // ── END DIAGNOSTIC ───────────────────────────────────────────────────────

    return items;
  }, [currentChapterData]);

  const bookDisplayName = language === 'en' ? currentBook : (bibleIndex?.[currentBook]?.hi || currentBook);

  // Find current display item index based on reading position
  const currentDisplayIndex = useMemo(() => {
    return displayItems.findIndex(
      item => item.verseIndex === readingVerseIndex && item.slideIndex === readingSlideIndex
    );
  }, [displayItems, readingVerseIndex, readingSlideIndex]);

  // Scroll to reading verse (white highlight)
  useEffect(() => {
    if (currentDisplayIndex >= 0 && contentRef.current) {
      const el = document.getElementById(`slide-card-${currentDisplayIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentDisplayIndex]);

  const handlePreviousChapter = useCallback(() => {
    if (!bibleIndex || !currentBook) return;
    const chapters = Object.keys(bibleIndex[currentBook].chapters).map(Number).sort((a, b) => a - b);
    const currentIdx = chapters.indexOf(parseInt(currentChapter));
    if (currentIdx > 0) {
      setLocation(currentBook, chapters[currentIdx - 1].toString(), '1');
    }
  }, [bibleIndex, currentBook, currentChapter, setLocation]);

  const handleNextChapter = useCallback(() => {
    if (!bibleIndex || !currentBook) return;
    const chapters = Object.keys(bibleIndex[currentBook].chapters).map(Number).sort((a, b) => a - b);
    const currentIdx = chapters.indexOf(parseInt(currentChapter));
    if (currentIdx < chapters.length - 1) {
      setLocation(currentBook, chapters[currentIdx + 1].toString(), '1');
    }
  }, [bibleIndex, currentBook, currentChapter, setLocation]);

  const canGoPrevious = useMemo(() => {
    if (!bibleIndex || !currentBook) return false;
    const chapters = Object.keys(bibleIndex[currentBook].chapters).map(Number).sort((a, b) => a - b);
    return chapters.indexOf(parseInt(currentChapter)) > 0;
  }, [bibleIndex, currentBook, currentChapter]);

  const canGoNext = useMemo(() => {
    if (!bibleIndex || !currentBook) return false;
    const chapters = Object.keys(bibleIndex[currentBook].chapters).map(Number).sort((a, b) => a - b);
    return chapters.indexOf(parseInt(currentChapter)) < chapters.length - 1;
  }, [bibleIndex, currentBook, currentChapter]);

  // Keyboard navigation (simplified like WMB)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (e.key === 'ArrowLeft') {
        handlePreviousChapter();
      } else if (e.key === 'ArrowRight') {
        handleNextChapter();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Navigate to next verse/slide
        if (currentDisplayIndex < displayItems.length - 1) {
          const nextItem = displayItems[currentDisplayIndex + 1];
          if (liveVerseIndex >= 0) {
            // If in live mode, navigate live
            toggleLiveVerse(nextItem.verseIndex, nextItem.slideIndex);
          } else {
            // Otherwise navigate reading
            setReadingVerse(nextItem.verseIndex);
            setReadingSlide(nextItem.slideIndex);
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Navigate to previous verse/slide
        if (currentDisplayIndex > 0) {
          const prevItem = displayItems[currentDisplayIndex - 1];
          if (liveVerseIndex >= 0) {
            // If in live mode, navigate live
            toggleLiveVerse(prevItem.verseIndex, prevItem.slideIndex);
          } else {
            // Otherwise navigate reading
            setReadingVerse(prevItem.verseIndex);
            setReadingSlide(prevItem.slideIndex);
          }
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Prevent Enter toggle if we just navigated from search
        if (justNavigatedFromSearch) {
          return;
        }
        // Toggle live mode at current reading position
        if (currentDisplayIndex >= 0) {
          const currentItem = displayItems[currentDisplayIndex];
          toggleLiveVerse(currentItem.verseIndex, currentItem.slideIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayItems.length, currentDisplayIndex, handlePreviousChapter, handleNextChapter, setReadingVerse, toggleLiveVerse, liveVerseIndex]);

  // Listen for slide changes from presentation page
  useEffect(() => {
    const handleCommand = (cmd: { action: string; data: any }) => {
      if (!cmd) return;
      
      if (cmd.action === 'slideChanged') {
        setPresentationSlide(cmd.data.index, cmd.data.total);
      } else if (cmd.action === 'slideInfo') {
        setPresentationSlide(cmd.data.currentIndex, cmd.data.totalSlides);
      }
    };

    const presentationChannel = new BroadcastChannel('bible_presentation_channel');
    presentationChannel.onmessage = (event) => {
      handleCommand(event.data);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'biblePresentationCommand' && e.newValue) {
        try {
          const cmd = JSON.parse(e.newValue);
          handleCommand(cmd);
        } catch (e) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      presentationChannel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setPresentationSlide]);


  if (!currentBookData || !currentChapterData) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        color: 'var(--text-muted)',
        fontSize: '13px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ fontSize: '32px', opacity: 0.25 }}>📖</div>
        <div>Search for a book to begin reading</div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Reader Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        height: '44px',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}>
            BIBLE
          </span>
          <span style={{ color: 'var(--border-mid)', fontSize: '12px' }}>·</span>
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {bookDisplayName} {currentChapter}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Language Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setLanguage('en')}
              style={{
                padding: '6px 10px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: language === 'en' ? 'var(--bg-active)' : 'var(--bg-card)',
                color: language === 'en' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                fontFamily: "'Noto Sans', sans-serif",
                transition: 'all 0.12s',
              }}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              style={{
                padding: '6px 10px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: language === 'hi' ? 'var(--bg-active)' : 'var(--bg-card)',
                color: language === 'hi' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                fontFamily: "'Noto Sans', sans-serif",
                transition: 'all 0.12s',
              }}
              title="Hindi"
            >
              HI
            </button>
          </div>

          {/* Chapter Navigation */}
          <button
            onClick={handlePreviousChapter}
            disabled={!canGoPrevious}
            style={{
              padding: '6px 10px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              color: 'var(--text-dim)',
              cursor: canGoPrevious ? 'pointer' : 'not-allowed',
              opacity: canGoPrevious ? 1 : 0.5,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Previous chapter (←)"
          >
            ←
          </button>
          <button
            onClick={handleNextChapter}
            disabled={!canGoNext}
            style={{
              padding: '6px 10px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              color: 'var(--text-dim)',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              opacity: canGoNext ? 1 : 0.5,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Next chapter (→)"
          >
            →
          </button>
        </div>
      </div>

      {/* Verses Content */}
      <div 
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {displayItems.map((item, idx) => {
          const isReading = item.verseIndex === readingVerseIndex && item.slideIndex === readingSlideIndex;
          const isLive = item.verseIndex === liveVerseIndex && item.slideIndex === presentationSlideIndex;
          
          return (
            <div
              key={idx}
              id={`slide-card-${idx}`}
              onClick={() => toggleLiveVerse(item.verseIndex, item.slideIndex)}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                flexShrink: 0
              }}
              className={`${isReading ? 'is-reading' : ''} ${isLive ? 'is-live' : ''}`}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '8px 12px 10px',
                fontFamily: "'Noto Serif', serif",
                fontSize: '15px',
                lineHeight: 1.65,
                color: isLive ? '#d4f7e4' : (isReading ? 'var(--text-primary)' : 'var(--text-muted)'),
              }}>
                <div style={{ display: 'inline', alignItems: 'baseline', flex: 1 }}>
                  <span style={{
                    background: 'var(--bg-active)',
                    color: 'var(--text-primary)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    minWidth: '20px',
                    textAlign: 'center',
                    display: 'inline-block',
                    verticalAlign: 'baseline',
                    marginRight: '8px'
                  }}>
                    {item.verseNum}
                  </span>
                  <span>{item.text}</span>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    addToBibleSetlist({
                      book: currentBook,
                      chapter: currentChapter,
                      verse: item.verseNum,
                      text: item.text,
                      reference: `${currentBook} ${currentChapter}:${item.verseNum}`,
                    });
                  }}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: '1px solid var(--border-mid)',
                    background: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s',
                    fontFamily: 'Inter, sans-serif',
                    flexShrink: 0,
                    marginLeft: '8px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-mid)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                  title="Save to List"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .is-reading {
          border-color: var(--border-active) !important;
        }
        .is-live {
          border-color: var(--green) !important;
          box-shadow: 0 0 0 1px var(--green-border), 0 0 14px var(--green-glow) !important;
        }
        .is-live:hover {
          border-color: var(--green) !important;
        }
      `}</style>
    </div>
  );
};
