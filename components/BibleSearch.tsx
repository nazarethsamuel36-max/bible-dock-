'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useBible } from '../context/BibleContext';

interface SearchResult {
  type: 'book' | 'chapter' | 'verse';
  book: string;
  chapter?: string;
  verse?: string;
  display: string;
  subtitle: string;
}

export const BibleSearch: React.FC = () => {
  const { state, setSearchQuery, goToReference, goToReferenceLive } = useBible();
  const { bibleIndex, searchQuery } = state;
  
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input with state
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Intent-based search routing
  const results = useMemo((): SearchResult[] => {
    if (!bibleIndex || !inputValue.trim()) return [];
    
    const query = inputValue.trim();
    const results: SearchResult[] = [];
    
    // Pattern 1: Book + Chapter + Verse with colon (e.g., "John 3:16")
    const bookChapterVerseMatch = query.match(/^(\d?\s*\w+)\s+(\d+):(\d+)$/i);
    if (bookChapterVerseMatch) {
      const [, book, chapter, verse] = bookChapterVerseMatch;
      const bookName = Object.keys(bibleIndex).find(
        b => b.toLowerCase() === book.trim().toLowerCase()
      );
      if (bookName) {
        results.push({
          type: 'verse',
          book: bookName,
          chapter,
          verse,
          display: `${bookName} ${chapter}:${verse}`,
          subtitle: 'Go to verse'
        });
      }
    }
    
    // Pattern 2: Book + Chapter + Verse without colon (e.g., "John 2 3")
    const bookChapterVerseSpaceMatch = query.match(/^(\d?\s*\w+)\s+(\d+)\s+(\d+)$/i);
    if (bookChapterVerseSpaceMatch) {
      const [, book, chapter, verse] = bookChapterVerseSpaceMatch;
      const bookName = Object.keys(bibleIndex).find(
        b => b.toLowerCase() === book.trim().toLowerCase()
      );
      if (bookName) {
        results.push({
          type: 'verse',
          book: bookName,
          chapter,
          verse,
          display: `${bookName} ${chapter}:${verse}`,
          subtitle: 'Go to verse'
        });
      }
    }
    
    // Pattern 3: Book + Chapter (e.g., "John 3")
    const bookChapterMatch = query.match(/^(\d?\s*\w+)\s+(\d+)$/i);
    if (bookChapterMatch) {
      const [, book, chapter] = bookChapterMatch;
      const bookName = Object.keys(bibleIndex).find(
        b => b.toLowerCase() === book.trim().toLowerCase()
      );
      if (bookName) {
        results.push({
          type: 'chapter',
          book: bookName,
          chapter,
          display: `${bookName} ${chapter}`,
          subtitle: 'Go to chapter'
        });
      }
    }
    
    // Pattern 5: Book only (e.g., "John")
    const bookMatch = query.match(/^(\d?\s*\w+)$/i);
    if (bookMatch) {
      const bookQuery = bookMatch[1].trim().toLowerCase();
      const matchingBooks = Object.keys(bibleIndex).filter(
        b => b.toLowerCase().includes(bookQuery)
      );
      matchingBooks.forEach(bookName => {
        results.push({
          type: 'book',
          book: bookName,
          display: bookName,
          subtitle: bibleIndex[bookName]?.hi || ''
        });
      });
    }
    
    return results;
  }, [bibleIndex, inputValue]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSearchQuery(value);
    setSelectedIndex(-1);
  }, [setSearchQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        const result = results[selectedIndex];
        setInputValue(result.display);
        setSearchQuery(result.display);
        setSelectedIndex(-1);
        // Navigate to reading mode (white) on Enter
        if (result.book) {
          goToReference(result.book, result.chapter, result.verse);
        }
      } else if (results.length === 1) {
        // Single result, navigate to reading mode (white)
        const result = results[0];
        setInputValue(result.display);
        setSearchQuery(result.display);
        if (result.book) {
          goToReference(result.book, result.chapter, result.verse);
        }
      }
    } else if (e.key === 'Escape') {
      setInputValue('');
      setSearchQuery('');
      setSelectedIndex(-1);
    }
  }, [results, selectedIndex, setSearchQuery, goToReference]);

  const handleResultClick = useCallback((result: SearchResult) => {
    setInputValue(result.display);
    setSearchQuery(result.display);
    setSelectedIndex(-1);
    // Navigate immediately on click
    if (result.book) {
      goToReference(result.book, result.chapter, result.verse);
    }
  }, [setSearchQuery, goToReference]);

  const handleNavigate = useCallback(() => {
    if (results.length === 1) {
      const result = results[0];
      goToReference(result.book, result.chapter, result.verse);
    }
  }, [results, goToReference]);

  return (
    <div className="bible-search-workspace" style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '12px 14px'
    }}>
      {/* Search Input */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{
            position: 'absolute',
            left: '10px',
            color: 'var(--text-muted)',
            fontSize: '14px',
            pointerEvents: 'none',
            lineHeight: 1
          }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Bible..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 12px 0 34px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.15s'
            }}
          />
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0'
        }}>
          {results.map((result, index) => (
            <div
              key={`${result.book}-${result.chapter}-${result.verse}-${index}`}
              onClick={() => handleResultClick(result)}
              onDoubleClick={() => goToReference(result.book, result.chapter, result.verse)}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background 0.1s',
                background: index === selectedIndex ? 'var(--bg-hover)' : 'transparent'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '3px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: result.type === 'book' ? 'rgba(255,255,255,0.08)' : 'var(--green-dim)',
                    color: result.type === 'book' ? 'var(--text-primary)' : 'var(--green)'
                  }}>
                    {result.type}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    {result.display}
                  </span>
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}>
                {result.subtitle}
              </div>
            </div>
          ))}
          
          {results.length > 0 && (
            <div style={{
              padding: '12px 14px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              borderTop: '1px solid var(--border)',
              marginTop: '8px'
            }}>
              Click to navigate
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!inputValue && (
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
          <div>Search for books, chapters, or verses</div>
          <div style={{ fontSize: '11px', marginTop: '8px' }}>
            Try: "John", "John 3", or "John 3:16"
          </div>
        </div>
      )}

      {inputValue && results.length === 0 && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
          No results for "<strong>{inputValue}</strong>"
        </div>
      )}
    </div>
  );
};
