'use client';

import React from 'react';
import { useBible } from '../context/BibleContext';

interface Tab {
  id: 'search' | 'reader' | 'list' | 'settings';
  icon: string;
  label: string;
}

const TABS: Tab[] = [
  { id: 'search',   icon: '⌕',  label: 'Search'   },
  { id: 'reader',   icon: '📖', label: 'Reader'   },
  { id: 'list',     icon: '📋', label: 'List'     },
  { id: 'settings', icon: '⚙',  label: 'Settings' },
];

export const BottomNavigation: React.FC = () => {
  const { state, setWorkspace } = useBible();

  return (
    <nav style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'stretch',
      height: '52px',
      background: 'var(--bg-panel)',
      borderTop: '1px solid var(--border)',
      zIndex: 20,
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setWorkspace(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
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
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: state.activeWorkspace === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
          }}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
