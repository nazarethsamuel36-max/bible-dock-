'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [copiedDock, setCopiedDock] = useState<boolean>(false);
  const [copiedOverlay, setCopiedOverlay] = useState<boolean>(false);

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    });
  };

  // Allow body to scroll on landing page (overrides the app-wide overflow:hidden)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevHeight   = document.body.style.height;
    document.body.style.overflow = 'auto';
    document.body.style.height   = 'auto';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.height   = prevHeight;
    };
  }, []);

  const domain = 'https://hindienglishbible-dock.vercel.app';
  const dockUrl = `${domain}/dock`;
  const overlayUrl = `${domain}/presentation`;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111113',
      padding: '40px 20px 60px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 800,
          color: '#fff',
          marginBottom: '12px',
          letterSpacing: '-0.02em'
        }}>
          Bible Dock
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#a0aec0',
          marginBottom: '48px',
          fontWeight: 400
        }}>
          Bible Presentation & Controller Hub
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {/* Dock Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '12px'
            }}>
              Dock Controller
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#a0aec0',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              Open the presentation workspace to find verses, read scripture, and control overlays in real time.
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '13px',
                color: '#e2e8f0',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {dockUrl}
              </span>
              <button
                onClick={() => copyToClipboard(dockUrl, setCopiedDock)}
                style={{
                  padding: '6px 12px',
                  background: copiedDock ? '#48bb78' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copiedDock ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <Link
              href="/dock"
              style={{
                display: 'block',
                padding: '12px 24px',
                background: '#48bb78',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#38a169'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#48bb78'}
            >
              Open Dock
            </Link>
          </div>

          {/* Presentation Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '12px'
            }}>
              OBS Overlay Display
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#a0aec0',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              Open this display window on your presentation output monitor or load it directly as a transparent browser source in OBS.
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '13px',
                color: '#e2e8f0',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {overlayUrl}
              </span>
              <button
                onClick={() => copyToClipboard(overlayUrl, setCopiedOverlay)}
                style={{
                  padding: '6px 12px',
                  background: copiedOverlay ? '#48bb78' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copiedOverlay ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <Link
              href="/presentation"
              style={{
                display: 'block',
                padding: '12px 24px',
                background: '#48bb78',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#38a169'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#48bb78'}
            >
              Open Presentation
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

