'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface VerificationCameraProps {
  studentName: string
  onCapture: (photoDataUrl: string) => void
  onCancel: () => void
}

export default function VerificationCamera({ studentName, onCapture, onCancel }: VerificationCameraProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [ready,       setReady]      = useState(false)
  const [captured,    setCaptured]   = useState<string | null>(null)
  const [camError,    setCamError]   = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Location — starts empty, user must tap "Add Location"
  const [location,   setLocation]   = useState<string>('')
  const [locStatus,  setLocStatus]  = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [coords,     setCoords]     = useState<{ lat: number; lng: number } | null>(null)

  /* ── Live clock ─────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* ── Camera ─────────────────────────────────────────────── */
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
    setCamError('')
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
      setCamError('Could not access camera. Please allow camera permission.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  /* ── Location — user-triggered ──────────────────────────── */
  const requestLocation = useCallback(() => {
    if (locStatus === 'loading') return
    setLocStatus('loading')
    setLocation('Getting location...')

    if (!('geolocation' in navigator)) {
      setLocation('GPS not supported on this device')
      setLocStatus('error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })

        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
            { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(8000) }
          )
          if (res.ok) {
            const data = await res.json()
            const a = data.address ?? {}
            const parts = [
              a.village || a.suburb || a.neighbourhood || a.county || '',
              a.city || a.town || a.municipality || a.state || '',
              a.country_code?.toUpperCase() || '',
            ].filter(Boolean)
            setLocation(parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          } else {
            setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          }
        } catch {
          setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        }
        setLocStatus('ok')
      },
      (err) => {
        setLocStatus('error')
        if (err.code === 1) {
          setLocation('Permission denied')
        } else if (err.code === 2) {
          setLocation('GPS signal unavailable')
        } else {
          setLocation('Timed out')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [locStatus])

  /* ── Format stamp ───────────────────────────────────────── */
  const formatStamp = (d: Date) => ({
    date: d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
  })

  /* ── Capture ─────────────────────────────────────────────── */
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

    ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -W, 0, W, H); ctx.restore()

    const now   = new Date()
    const stamp = formatStamp(now)
    const fs    = W / 640

    // Bar height depends on whether we have location
    const hasLoc = locStatus === 'ok' && location
    const barH   = hasLoc ? 92 : 72

    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, H - barH, W, barH)

    // Name
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${Math.round(22 * fs)}px -apple-system,Arial,sans-serif`
    ctx.fillText(studentName, 12, H - barH + 24)

    // Date
    ctx.fillStyle = '#D1D5DB'
    ctx.font = `${Math.round(17 * fs)}px -apple-system,Arial,sans-serif`
    ctx.fillText(stamp.date, 12, H - barH + 46)

    // Location
    if (hasLoc) {
      ctx.fillStyle = '#86EFAC'
      ctx.font = `${Math.round(15 * fs)}px -apple-system,Arial,sans-serif`
      let loc = `📍 ${location}`
      while (ctx.measureText(loc).width > W * 0.65 && loc.length > 10) {
        loc = loc.slice(0, -4) + '…'
      }
      ctx.fillText(loc, 12, H - barH + 68)
      if (coords) {
        ctx.fillStyle = '#6EE7B7'
        ctx.font = `${Math.round(12 * fs)}px monospace`
        ctx.fillText(`${coords.lat.toFixed(5)}°N  ${coords.lng.toFixed(5)}°E`, 12, H - barH + 85)
      }
    }

    // Time
    ctx.fillStyle = '#FDE68A'
    ctx.font = `bold ${Math.round(24 * fs)}px monospace`
    const timeW = ctx.measureText(stamp.time).width
    ctx.fillText(stamp.time, W - timeW - 12, H - barH + 34)

    // Verified dot
    ctx.beginPath()
    ctx.arc(W - 14, H - barH + 54, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#10B981'
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = `bold ${Math.round(10 * fs)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('✓', W - 14, H - barH + 58)
    ctx.textAlign = 'left'

    setCaptured(canvas.toDataURL('image/jpeg', 0.88))
    stopCamera()
  }, [studentName, location, locStatus, coords])

  const retake = () => { setCaptured(null); startCamera() }

  const { date: liveDate, time: liveTime } = formatStamp(currentTime)

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <div style={{ background: '#111827', borderRadius: 20, overflow: 'hidden',
        width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1F2937',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>Verification Photo</p>
            <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
              Name · Date · Time {locStatus === 'ok' ? '· Location ✓' : '· Location optional'}
            </p>
          </div>
          <button onClick={onCancel} style={{ color: '#9CA3AF', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Location bar — user-triggered */}
        <div style={{ padding: '10px 16px', background: '#0F172A',
          display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1F2937' }}>
          {locStatus === 'ok' ? (
            <>
              <svg style={{ width: 14, height: 14, color: '#10B981', flexShrink: 0 }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <p style={{ color: '#86EFAC', fontSize: 12, margin: 0, flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📍 {location}
              </p>
              {coords && <span style={{ fontSize: 10, color: '#4B5563', flexShrink: 0 }}>
                {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
              </span>}
            </>
          ) : locStatus === 'loading' ? (
            <>
              <div style={{ width: 14, height: 14, border: '2px solid #374151',
                borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <p style={{ color: '#FCD34D', fontSize: 12, margin: 0, animation: 'pulse 1.5s ease infinite' }}>
                Getting location...
              </p>
            </>
          ) : locStatus === 'error' ? (
            <>
              <p style={{ color: '#FCA5A5', fontSize: 12, margin: 0, flex: 1 }}>
                {location || 'Location unavailable'}
              </p>
              <button onClick={requestLocation} style={{ padding: '3px 10px', background: '#F97316',
                color: 'white', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                Retry
              </button>
            </>
          ) : (
            /* idle — user hasn't tapped yet */
            <>
              <svg style={{ width: 14, height: 14, color: '#4B5563', flexShrink: 0 }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <p style={{ color: '#6B7280', fontSize: 12, margin: 0, flex: 1 }}>
                Location not added
              </p>
              <button onClick={requestLocation} style={{ padding: '4px 12px', background: '#1E293B',
                color: '#86EFAC', border: '1px solid #10B981', borderRadius: 6, fontSize: 11,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                whiteSpace: 'nowrap' }}>
                + Add Location
              </button>
            </>
          )}
        </div>

        {/* Camera / Preview */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3' }}>
          {!captured ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'cover',
                  transform: 'scaleX(-1)', display: ready ? 'block' : 'none' }} />

              {!ready && !camError && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, border: '3px solid #374151',
                    borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#6B7280', fontSize: 13 }}>Starting camera...</p>
                </div>
              )}

              {camError && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 12 }}>
                  <p style={{ color: '#F87171', fontSize: 13 }}>{camError}</p>
                  <button onClick={startCamera} style={{ padding: '8px 20px', background: '#6366F1',
                    color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Try Again
                  </button>
                </div>
              )}

              {/* Live overlay */}
              {ready && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.6)', padding: '8px 12px', pointerEvents: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                        {studentName}
                      </p>
                      <p style={{ color: '#D1D5DB', fontSize: 11, margin: '2px 0', lineHeight: 1.3 }}>{liveDate}</p>
                      {locStatus === 'ok' && (
                        <p style={{ color: '#86EFAC', fontSize: 11, margin: 0, lineHeight: 1.3,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📍 {location}
                        </p>
                      )}
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
            <img src={captured} alt="Verification"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Actions */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
          {!captured ? (
            <>
              <button onClick={onCancel} style={{ flex: 1, padding: '11px 0', borderRadius: 10,
                fontSize: 14, fontWeight: 600, background: '#1F2937', color: '#9CA3AF',
                border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={capturePhoto} disabled={!ready}
                style={{ flex: 2, padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: ready ? '#6366F1' : '#374151', color: ready ? 'white' : '#6B7280',
                  border: 'none', cursor: ready ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
              <button onClick={retake} style={{ flex: 1, padding: '11px 0', borderRadius: 10,
                fontSize: 14, fontWeight: 600, background: '#1F2937', color: '#9CA3AF',
                border: 'none', cursor: 'pointer' }}>Retake</button>
              <button onClick={() => onCapture(captured)} style={{ flex: 2, padding: '11px 0', borderRadius: 10,
                fontSize: 14, fontWeight: 700, background: '#10B981', color: 'white',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
            Tap <strong style={{ color: '#86EFAC' }}>+ Add Location</strong> above to include your location in the stamp.
            Name, date and time are always included.
          </p>
        </div>
      </div>
    </div>
  )
}
