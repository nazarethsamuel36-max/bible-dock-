'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [origin, setOrigin] = useState<string>('http://localhost:3000');
  const [copiedDock, setCopiedDock] = useState<boolean>(false);
  const [copiedOverlay, setCopiedOverlay] = useState<boolean>(false);
  const [copiedOverlayPreview, setCopiedOverlayPreview] = useState<boolean>(false);
  const [copiedOverlayBanner, setCopiedOverlayBanner] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    });
  };

  const dockUrl = `${origin}/dock`;
  const overlayUrl = `${origin}/presentation`;
  const overlayPreviewUrl = `${origin}/presentation?preview=true`;
  const overlayBannerUrl = `${origin}/presentation?banner=true`;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        textAlign: 'center'
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
                {overlayPreviewUrl}
              </span>
              <button
                onClick={() => copyToClipboard(overlayPreviewUrl, setCopiedOverlayPreview)}
                style={{
                  padding: '6px 12px',
                  background: copiedOverlayPreview ? '#48bb78' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copiedOverlayPreview ? 'Copied!' : 'Copy'}
              </button>
            </div>
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
                {overlayBannerUrl}
              </span>
              <button
                onClick={() => copyToClipboard(overlayBannerUrl, setCopiedOverlayBanner)}
                style={{
                  padding: '6px 12px',
                  background: copiedOverlayBanner ? '#48bb78' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copiedOverlayBanner ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/presentation"
                style={{
                  padding: '12px 20px',
                  background: '#48bb78',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#38a169'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#48bb78'}
              >
                Live (Transparent)
              </Link>
              <Link
                href="/presentation?preview=true"
                style={{
                  padding: '12px 20px',
                  background: '#4a5568',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2d3748'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#4a5568'}
              >
                Preview Mode
              </Link>
              <Link
                href="/presentation?banner=true"
                style={{
                  padding: '12px 20px',
                  background: '#2d3748',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a202c'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2d3748'}
              >
                Banner Mode
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
