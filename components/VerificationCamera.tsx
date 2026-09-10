'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface VerificationCameraProps {
  studentName: string
  onCapture: (photoDataUrl: string) => void
  onCancel: () => void
}

/**
 * VerificationCamera
 * Opens the device camera, overlays a date/time/name stamp,
 * and captures a verification selfie for narrative submission.
 */
export default function VerificationCamera({
  studentName,
  onCapture,
  onCancel,
}: VerificationCameraProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)

  const [ready,       setReady]       = useState(false)
  const [captured,    setCaptured]    = useState<string | null>(null)
  const [error,       setError]       = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
    setError('')
    try {
      // Prefer front (selfie) camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch (e) {
      console.error('Camera error:', e)
      setError('Could not access camera. Please allow camera permission and try again.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const formatStamp = (d: Date) => {
    const date = d.toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const time = d.toLocaleTimeString('en-PH', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    })
    return { date, time }
  }

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

    // Draw the mirrored video frame (selfie style)
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -W, 0, W, H)
    ctx.restore()

    // ── Stamp overlay ────────────────────────────────────────────
    const now   = new Date()
    const stamp = formatStamp(now)

    // Semi-transparent dark bar at bottom
    const barH = 72
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    ctx.fillRect(0, H - barH, W, barH)

    // Name
    ctx.fillStyle = '#FFFFFF'
    ctx.font      = `bold ${Math.round(W * 0.034)}px -apple-system, sans-serif`
    ctx.fillText(studentName, 12, H - barH + 22)

    // Date
    ctx.fillStyle = '#E5E7EB'
    ctx.font      = `${Math.round(W * 0.028)}px -apple-system, sans-serif`
    ctx.fillText(stamp.date, 12, H - barH + 44)

    // Time (right-aligned, larger)
    ctx.fillStyle = '#FDE68A'
    ctx.font      = `bold ${Math.round(W * 0.038)}px monospace`
    const timeW   = ctx.measureText(stamp.time).width
    ctx.fillText(stamp.time, W - timeW - 12, H - barH + 50)

    // Green dot indicator
    ctx.beginPath()
    ctx.arc(W - 14, H - barH + 14, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#10B981'
    ctx.fill()

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCaptured(dataUrl)
    stopCamera()
  }, [studentName])

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  const confirm = () => {
    if (captured) {
      onCapture(captured)
    }
  }

  const { date: liveDate, time: liveTime } = formatStamp(currentTime)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        background: '#111827', borderRadius: 20, overflow: 'hidden',
        width: '100%', maxWidth: 520,
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1F2937',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
              Verification Photo
            </p>
            <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
              Take a selfie to confirm your narrative submission
            </p>
          </div>
          <button onClick={onCancel} style={{
            color: '#9CA3AF', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Camera / Preview */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3' }}>
          {!captured ? (
            <>
              {/* Live video — mirrored for selfie */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: 'scaleX(-1)', display: ready ? 'block' : 'none',
                }}
              />

              {/* Loading state */}
              {!ready && !error && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40,
                    border: '3px solid #374151', borderTopColor: '#6366F1',
                    borderRadius: '50%', animation: 'spin 1s linear infinite',
                  }} />
                  <p style={{ color: '#6B7280', fontSize: 13 }}>Starting camera...</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: 24, textAlign: 'center', gap: 12,
                }}>
                  <svg style={{ width: 48, height: 48, color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <p style={{ color: '#F87171', fontSize: 13, lineHeight: 1.5 }}>{error}</p>
                  <button onClick={startCamera} style={{
                    padding: '8px 20px', background: '#6366F1', color: 'white',
                    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>
                    Try Again
                  </button>
                </div>
              )}

              {/* Live stamp overlay on viewfinder */}
              {ready && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.5)',
                  padding: '8px 12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  pointerEvents: 'none',
                }}>
                  <div>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
                      {studentName}
                    </p>
                    <p style={{ color: '#D1D5DB', fontSize: 11, lineHeight: 1.3 }}>{liveDate}</p>
                  </div>
                  <p style={{ color: '#FDE68A', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                    {liveTime}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Captured preview */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={captured}
              alt="Verification photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Actions */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
          {!captured ? (
            <>
              <button onClick={onCancel} style={{
                flex: 1, padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: '#1F2937', color: '#9CA3AF', border: 'none', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                disabled={!ready}
                style={{
                  flex: 2, padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: ready ? '#6366F1' : '#374151',
                  color: ready ? 'white' : '#6B7280',
                  border: 'none', cursor: ready ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
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
              }}>
                Retake
              </button>
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

        {/* Instruction */}
        <div style={{
          padding: '0 20px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <svg style={{ width: 14, height: 14, color: '#6366F1', flexShrink: 0, marginTop: 1 }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p style={{ color: '#6B7280', fontSize: 11, lineHeight: 1.5 }}>
            Your name, date, and time will be stamped on the photo as proof of timely submission.
            This photo will be visible to your teacher.
          </p>
        </div>

      </div>
    </div>
  )
}
