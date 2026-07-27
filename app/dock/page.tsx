'use client';

import { BibleContextProvider, useBible } from '../../context/BibleContext';
import { BibleSearch } from '../../components/BibleSearch';
import { BibleReader } from '../../components/BibleReader';
import { BibleSetlist } from '../../components/BibleSetlist';
import { BottomNavigation } from '../../components/BottomNavigation';

function BibleApp() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      <BibleContextProvider>
        <BibleAppContent />
      </BibleContextProvider>
    </div>
  );
}

function BibleAppContent() {
  const { state, setLanguage } = useBible();
  const { activeWorkspace, language } = state;

  return (
    <>
      {/* Workspace Area */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {activeWorkspace === 'search' && <BibleSearch />}
        {activeWorkspace === 'reader' && <BibleReader />}
        {activeWorkspace === 'list'   && <BibleSetlist />}
      </div>

      {/* Language Toggle — full-width bar, right above bottom nav for fast access */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        height: '20px',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border)',
      }}>
        <button
          onClick={() => setLanguage('en')}
          style={{
            flex: 1,
            border: 'none',
            borderRight: '1px solid var(--border)',
            background: language === 'en' ? 'var(--bg-active)' : 'transparent',
            color: language === 'en' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.12s',
            position: 'relative',
          }}
          onMouseEnter={e => {
            if (language !== 'en') e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={e => {
            if (language !== 'en') e.currentTarget.style.background = 'transparent';
          }}
        >
          {language === 'en' && (
            <div style={{
              position: 'absolute',
              top: 0, left: '20%', right: '20%',
              height: '2px',
              background: 'var(--text-primary)',
              borderRadius: '0 0 2px 2px',
            }} />
          )}
          EN — English
        </button>

        <button
          onClick={() => setLanguage('hi')}
          style={{
            flex: 1,
            border: 'none',
            background: language === 'hi' ? 'var(--bg-active)' : 'transparent',
            color: language === 'hi' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.12s',
            position: 'relative',
          }}
          onMouseEnter={e => {
            if (language !== 'hi') e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={e => {
            if (language !== 'hi') e.currentTarget.style.background = 'transparent';
          }}
        >
          {language === 'hi' && (
            <div style={{
              position: 'absolute',
              top: 0, left: '20%', right: '20%',
              height: '2px',
              background: 'var(--text-primary)',
              borderRadius: '0 0 2px 2px',
            }} />
          )}
          हिंदी — Hindi
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </>
  );
}

export default BibleApp;
