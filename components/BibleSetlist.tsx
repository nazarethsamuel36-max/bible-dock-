'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBible } from '../context/BibleContext';

export interface SavedVerse {
  book: string;
  chapter: string;
  verse: string;
  text: string;
  reference: string;
}

const STORAGE_KEY = 'bible_setlist';

export function getBibleSetlist(): SavedVerse[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function addToBibleSetlist(v: SavedVerse): void {
  const list = getBibleSetlist().filter(x => x.reference !== v.reference);
  list.unshift(v);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 60)));
}

export function removeFromBibleSetlist(reference: string): void {
  const list = getBibleSetlist().filter(v => v.reference !== reference);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const BibleSetlist: React.FC = () => {
  const { goToReference } = useBible();
  const [setlist, setSetlist] = useState<SavedVerse[]>([]);

  useEffect(() => {
    setSetlist(getBibleSetlist());
  }, []);

  const handleRemove = useCallback((e: React.MouseEvent, reference: string) => {
    e.stopPropagation();
    removeFromBibleSetlist(reference);
    setSetlist(getBibleSetlist());
  }, []);

  const handleClick = useCallback((verse: SavedVerse) => {
    goToReference(verse.book, verse.chapter, verse.verse);
  }, [goToReference]);

  const handleClearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSetlist([]);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: '8px 14px 7px',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          Saved Verses — {setlist.length}
        </span>
        {setlist.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              padding: '2px 6px',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Clear All
          </button>
        )}
      </div>

      {/* List */}
      {setlist.length === 0 ? (
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
          padding: '20px',
        }}>
          <div style={{ fontSize: '32px', opacity: 0.25 }}>📋</div>
          <div>No saved verses yet</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Tap <strong style={{ color: 'var(--text-dim)' }}>+</strong> on any verse<br />in the Reader to save it here
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          {setlist.map((verse) => (
            <div
              key={verse.reference}
              onClick={() => handleClick(verse)}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'border-color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-mid)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {/* Card header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderBottom: '1px solid var(--border)',
                userSelect: 'none',
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  letterSpacing: '0.04em',
                }}>
                  {verse.reference}
                </span>
                <button
                  onClick={e => handleRemove(e, verse.reference)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.1s',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Remove"
                >
                  ×
                </button>
              </div>
              {/* Verse text */}
              <div style={{
                padding: '8px 12px 10px',
                fontFamily: "'Crimson Text', serif",
                fontSize: '15px',
                lineHeight: 1.65,
                color: 'var(--text-dim)',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {verse.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
