'use client';

import React from 'react';
import { useBible } from '../context/BibleContext';

interface Tab {
  id: 'search' | 'reader' | 'list';
  label: string;
}

const TABS: Tab[] = [
  { id: 'search', label: 'Search' },
  { id: 'reader', label: 'Reader' },
  { id: 'list',   label: 'List'   },
];

export const BottomNavigation: React.FC = () => {
  const { state, setWorkspace } = useBible();

  return (
    <nav style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'stretch',
      height: '30px',
      background: 'var(--bg-panel)',
      borderTop: '1px solid var(--border)',
      padding: '0',
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setWorkspace(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: state.activeWorkspace === tab.id ? 'var(--bg-active)' : 'transparent',
            cursor: 'pointer',
            transition: 'background 0.12s',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
            padding: 0,
          }}
          onMouseEnter={e => {
            if (state.activeWorkspace !== tab.id)
              e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={e => {
            if (state.activeWorkspace !== tab.id)
              e.currentTarget.style.background = 'transparent';
          }}
        >
          {state.activeWorkspace === tab.id && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: '20%',
              height: '2px',
              background: 'var(--text-primary)',
              borderRadius: '0 0 2px 2px',
            }} />
          )}
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: state.activeWorkspace === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
          }}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
