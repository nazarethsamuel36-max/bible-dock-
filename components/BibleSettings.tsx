'use client';

import React from 'react';

export const BibleSettings: React.FC = () => {
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
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }}>⚙</div>
      <div>Settings</div>
      <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7 }}>
        Coming soon
      </div>
    </div>
  );
};
