'use client';

import { BibleContextProvider, useBible } from '../../context/BibleContext';
import { BibleSearch } from '../../components/BibleSearch';
import { BibleReader } from '../../components/BibleReader';
import { BibleSettings } from '../../components/BibleSettings';
import { BottomNavigation } from '../../components/BottomNavigation';

function BibleApp() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg-base)'
    }}>
      <BibleContextProvider>
        <BibleAppContent />
      </BibleContextProvider>
    </div>
  );
}

function BibleAppContent() {
  const { state } = useBible();
  const { activeWorkspace } = state;

  return (
    <>
      {/* Workspace Area */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeWorkspace === 'search' && <BibleSearch />}
        {activeWorkspace === 'reader' && <BibleReader />}
        {activeWorkspace === 'settings' && <BibleSettings />}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </>
  );
}

export default BibleApp;
