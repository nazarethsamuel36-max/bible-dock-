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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎛️</div>
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
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

        {/* GitHub Links */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <a
            href="https://github.com/nazarethsamuel36-max/bible-dock"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub Repository
          </a>
        </div>

        <div style={{
          marginTop: '48px',
          fontSize: '13px',
          color: '#718096'
        }}>
          Powered by Next.js + React. English & Hindi Bible support with KJV text.
        </div>
      </div>
    </div>
  );
}

