'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface VerificationCameraProps {
  studentName: string
  onCapture: (photoDataUrl: string) => void
  onCancel: () => void
}

export default function VerificationCamera({
  studentName,
  onCapture,
  onCancel,
}: VerificationCameraProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [ready,       setReady]       = useState(false)
  const [captured,    setCaptured]    = useState<string | null>(null)
  const [error,       setError]       = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Location state
  const [location,    setLocation]    = useState<string>('Locating...')
  const [locDone,     setLocDone]     = useState(false)
  const [coords,      setCoords]      = useState<{ lat: number; lng: number } | null>(null)

  /* ── Live clock ─────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* ── Get GPS location on mount + retry ─────────────────── */
  const fetchLocation = useCallback(async () => {
    setLocation('Locating...')
    setLocDone(false)

    if (!navigator.geolocation) {
      setLocation('GPS not available on this device')
      setLocDone(true)
      return
    }

    // Check permission state first (where supported)
    if (navigator.permissions) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' })
        if (perm.state === 'denied') {
          setLocation('Location blocked — enable in browser settings')
          setLocDone(true)
          return
        }
      } catch { /* not supported — continue */ }
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCoords({ lat, lng })
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const a = data.address ?? {}
          const parts = [
            a.village || a.suburb || a.neighbourhood || a.district || a.county || '',
            a.city || a.town || a.municipality || a.state || '',
            a.country_code?.toUpperCase() || '',
          ].filter(Boolean)
          setLocation(parts.join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        } catch {
          setLocation(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`)
        }
        setLocDone(true)
      },
      (err) => {
        console.warn('Geolocation error code:', err.code, err.message)
        if (err.code === 1) {
          // PERMISSION_DENIED
          setLocation('tap to retry location')
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          setLocation('GPS signal unavailable')
        } else if (err.code === 3) {
          // TIMEOUT
          setLocation('Location timed out — tap to retry')
        } else {
          setLocation('Location not available')
        }
        setLocDone(true)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [])

  // Trigger location fetch on mount
  useEffect(() => { fetchLocation() }, [fetchLocation])
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch {
      setError('Could not access camera. Please allow camera permission and try again.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const formatStamp = (d: Date) => ({
    date: d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
  })

  /* ── Capture photo with full stamp ──────────────────────── */
  const capturePhoto = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const W = video.videoWidth  || 640
    const H = video.videoHeight || 480
    canvas.width  = W
    canvas.height = H

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Mirror (selfie style)
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -W, 0, W, H)
    ctx.restore()

    const now   = new Date()
    const stamp = formatStamp(now)

    // ── Stamp bar — taller to fit location ──────────────────
    const barH   = coords ? 92 : 72
    const fScale = W / 640  // scale fonts relative to 640px reference

    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, H - barH, W, barH)

    // Student name
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${Math.round(22 * fScale)}px -apple-system,Arial,sans-serif`
    ctx.fillText(studentName, 12, H - barH + 24)

    // Date
    ctx.fillStyle = '#D1D5DB'
    ctx.font = `${Math.round(17 * fScale)}px -apple-system,Arial,sans-serif`
    ctx.fillText(stamp.date, 12, H - barH + 46)

    // Location (truncated if too long)
    const maxLocW = W * 0.65
    ctx.fillStyle = '#86EFAC'  // light green
    ctx.font = `${Math.round(15 * fScale)}px -apple-system,Arial,sans-serif`
    // Pin icon inline as text
    const locText = `📍 ${location}`
    // Measure and truncate if needed
    let displayLoc = locText
    while (ctx.measureText(displayLoc).width > maxLocW && displayLoc.length > 10) {
      displayLoc = displayLoc.slice(0, -4) + '…'
    }
    ctx.fillText(displayLoc, 12, H - barH + (coords ? 68 : 66))

    // GPS coords in small text
    if (coords) {
      ctx.fillStyle = '#6EE7B7'
      ctx.font = `${Math.round(12 * fScale)}px monospace`
      ctx.fillText(`${coords.lat.toFixed(5)}°N  ${coords.lng.toFixed(5)}°E`, 12, H - barH + 85)
    }

    // Time (right-aligned)
    ctx.fillStyle = '#FDE68A'
    ctx.font = `bold ${Math.round(24 * fScale)}px monospace`
    const timeW = ctx.measureText(stamp.time).width
    ctx.fillText(stamp.time, W - timeW - 12, H - barH + 34)

    // Green verified dot
    ctx.beginPath()
    ctx.arc(W - 14, H - barH + 54, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#10B981'
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = `bold ${Math.round(10 * fScale)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('✓', W - 14, H - barH + 58)
    ctx.textAlign = 'left'

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    setCaptured(dataUrl)
    stopCamera()
  }, [studentName, location, coords])

  const retake = () => { setCaptured(null); startCamera() }
  const confirm = () => { if (captured) onCapture(captured) }

  const { date: liveDate, time: liveTime } = formatStamp(currentTime)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <div style={{
        background: '#111827', borderRadius: 20, overflow: 'hidden',
        width: '100%', maxWidth: 520,
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1F2937',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>
              Verification Photo
            </p>
            <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
              Name · Date · Time · Location stamped automatically
            </p>
          </div>
          <button onClick={onCancel} style={{
            color: '#9CA3AF', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Location status banner */}
        <div style={{
          padding: '8px 16px', background: '#0F172A',
          display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1F2937',
          minHeight: 38,
        }}>
          <svg style={{ width: 14, height: 14, color: locDone && coords ? '#10B981' : locDone ? '#EF4444' : '#F59E0B', flexShrink: 0 }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p style={{
            color: locDone && coords ? '#86EFAC' : locDone ? '#FCA5A5' : '#FCD34D',
            fontSize: 12, margin: 0, flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            animation: !locDone ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}>
            {location}
          </p>
          {coords && (
            <span style={{ fontSize: 10, color: '#4B5563', flexShrink: 0 }}>
              {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
            </span>
          )}
          {/* Show retry button if location failed */}
          {locDone && !coords && (
            <button onClick={() => fetchLocation()} style={{
              padding: '3px 10px', background: '#F97316', color: 'white',
              border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
            }}>
              Retry
            </button>
          )}
        </div>

        {/* Camera / Preview */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3' }}>
          {!captured ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'cover',
                  transform: 'scaleX(-1)', display: ready ? 'block' : 'none' }} />

              {!ready && !error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, border: '3px solid #374151',
                    borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#6B7280', fontSize: 13 }}>Starting camera...</p>
                </div>
              )}

              {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 12 }}>
                  <p style={{ color: '#F87171', fontSize: 13 }}>{error}</p>
                  <button onClick={startCamera} style={{
                    padding: '8px 20px', background: '#6366F1', color: 'white',
                    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>Try Again</button>
                </div>
              )}

              {/* Live stamp overlay */}
              {ready && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.6)', padding: '8px 12px', pointerEvents: 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                        {studentName}
                      </p>
                      <p style={{ color: '#D1D5DB', fontSize: 11, margin: '2px 0', lineHeight: 1.3 }}>{liveDate}</p>
                      <p style={{ color: '#86EFAC', fontSize: 11, margin: 0, lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📍 {location}
                      </p>
                    </div>
                    <p style={{ color: '#FDE68A', fontSize: 15, fontWeight: 700,
                      fontFamily: 'monospace', flexShrink: 0, paddingLeft: 8 }}>
                      {liveTime}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={captured} alt="Verification photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Actions */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
          {!captured ? (
            <>
              <button onClick={onCancel} style={{
                flex: 1, padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: '#1F2937', color: '#9CA3AF', border: 'none', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={capturePhoto} disabled={!ready}
                style={{
                  flex: 2, padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: ready ? '#6366F1' : '#374151',
                  color: ready ? 'white' : '#6B7280',
                  border: 'none', cursor: ready ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Take Photo
              </button>
            </>
          ) : (
            <>
              <button onClick={retake} style={{
                flex: 1, padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: '#1F2937', color: '#9CA3AF', border: 'none', cursor: 'pointer',
              }}>Retake</button>
              <button onClick={confirm} style={{
                flex: 2, padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: '#10B981', color: 'white', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
                Use This Photo
              </button>
            </>
          )}
        </div>

        {/* Footer note */}
        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
          <svg style={{ width: 14, height: 14, color: '#6366F1', flexShrink: 0, marginTop: 1 }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p style={{ color: '#6B7280', fontSize: 11, lineHeight: 1.5 }}>
            Your name, date, time and location are stamped on the photo as proof of timely submission.
            Allow location access for the full stamp.
          </p>
        </div>
      </div>
    </div>
  )
}
