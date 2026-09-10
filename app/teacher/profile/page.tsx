'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AppShell from '@/components/AppShell'

type ToastKind = 'success' | 'error' | 'info'
interface Toast { id: number; msg: string; kind: ToastKind }

function Toasts({ list, remove }: { list: Toast[]; remove: (id: number) => void }) {
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320, width: '100%' }}>
      {list.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 16px', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          background: t.kind === 'success' ? '#059669' : t.kind === 'error' ? '#DC2626' : '#374151',
          color: 'white', fontSize: 13, fontWeight: 600, animation: 'fadeIn 0.2s ease',
        }}>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>
      ))}
    </div>
  )
}

export default function TeacherProfilePage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()

  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [toasts,     setToasts]     = useState<Toast[]>([])
  const counter = useRef(0)

  const [name,       setName]       = useState('')
  const [teacherId,  setTeacherId]  = useState('')
  const [email,      setEmail]      = useState('')
  const [pic,        setPic]        = useState<string | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [file,       setFile]       = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const toast = (msg: string, kind: ToastKind = 'info') => {
    const id = ++counter.current
    setToasts(p => [...p, { id, msg, kind }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session?.user?.email) return
    const load = async () => {
      try {
        const res = await fetch('/api/teacher/profile')
        if (res.ok) {
          const { teacher: t } = await res.json()
          setName(t.name ?? '')
          setTeacherId(t.teacherId ?? '')
          setEmail(t.email ?? '')
          setPic(t.profilePicture ?? session.user.profilePicture ?? null)
        } else {
          // Fallback to session data
          setName(session.user.name ?? '')
          setEmail(session.user.email ?? '')
          setPic(session.user.profilePicture ?? null)
        }
      } catch {
        setName(session.user.name ?? '')
        setEmail(session.user.email ?? '')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) {
      toast('Use JPG, PNG, WebP or GIF', 'error'); return
    }
    if (f.size > 2 * 1024 * 1024) { toast('Max 2 MB', 'error'); return }
    setFile(f)
    const r = new FileReader()
    r.onload = ev => setPreview(ev.target?.result as string)
    r.readAsDataURL(f)
  }

  const uploadPic = async () => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/teacher/profile-picture', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPic(data.profilePicture)
      setPreview(null); setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await updateSession({ profilePicture: data.profilePicture })
      toast('Photo updated!', 'success')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally { setUploading(false) }
  }

  const removePic = async () => {
    setUploading(true)
    try {
      await fetch('/api/teacher/profile-picture', { method: 'DELETE' })
      setPic(null); setPreview(null); setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await updateSession({ profilePicture: null })
      toast('Photo removed', 'info')
    } catch { toast('Failed to remove', 'error') }
    finally { setUploading(false) }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast('Name is required', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast('Profile saved!', 'success')
      setTimeout(() => router.push('/teacher/dashboard'), 1200)
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  if (loading || status === 'loading') return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #FFEDD5',
          borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      </div>
    </AppShell>
  )

  const displayPic = preview ?? pic

  return (
    <>
      <Toasts list={toasts} remove={id => setToasts(p => p.filter(t => t.id !== id))} />
      <AppShell>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

        {/* Back */}
        <button onClick={() => router.push('/teacher/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280',
          background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20,
          padding: 0, fontFamily: 'inherit',
        }}>
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>

        <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Edit Profile</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Update your teacher profile information.</p>
          </div>

          {/* Photo card */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 18,
            padding: '24px', boxSizing: 'border-box' }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 20 }}>Profile Photo</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 88, height: 88, borderRadius: 18, overflow: 'hidden',
                  border: '3px solid #FED7AA', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: '#FFF7ED', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#F97316', fontWeight: 800, fontSize: 28 }}>
                  {displayPic
                    ? <Image src={displayPic} alt="Profile" width={88} height={88}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        unoptimized={displayPic.startsWith('data:')} />
                    : name.charAt(0).toUpperCase()
                  }
                </div>
                {preview && (
                  <span style={{ position: 'absolute', top: -4, right: -4,
                    background: '#F59E0B', color: 'white', fontSize: 9, fontWeight: 800,
                    padding: '2px 6px', borderRadius: 999, boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                    PREVIEW
                  </span>
                )}
              </div>

              {/* Upload controls */}
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input ref={fileRef} type="file" id="pic-upload" className="sr-only"
                  accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} />

                {!preview ? (
                  <label htmlFor="pic-upload" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 16px', border: '2px dashed #FED7AA', borderRadius: 12,
                    cursor: 'pointer', fontSize: 13, color: '#F97316', fontWeight: 600,
                    transition: 'all 0.15s', background: '#FFF7ED',
                  }}>
                    <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose a photo
                  </label>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={uploadPic} disabled={uploading} style={{
                      flex: 1, padding: '10px', background: '#F97316', color: 'white',
                      border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      opacity: uploading ? 0.7 : 1,
                    }}>
                      {uploading ? 'Saving...' : 'Save Photo'}
                    </button>
                    <button onClick={() => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                      disabled={uploading} style={{
                        padding: '10px 16px', background: '#F3F4F6', color: '#374151',
                        border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>Cancel</button>
                  </div>
                )}

                {pic && !preview && (
                  <button onClick={removePic} disabled={uploading} style={{
                    padding: '8px', background: '#FEF2F2', color: '#DC2626',
                    border: '1px solid #FECACA', borderRadius: 10, fontSize: 12,
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Remove Photo
                  </button>
                )}
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, textAlign: 'center' }}>
                  JPG, PNG, WebP or GIF · Max 2 MB
                </p>
              </div>
            </div>
          </div>

          {/* Info form */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 18,
            padding: '24px', boxSizing: 'border-box' }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 20 }}>
              Personal Information
            </p>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280',
                  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Full Name *
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your full name"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB',
                    borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit',
                    boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => { e.target.style.borderColor = '#F97316' }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
                />
              </div>

              {/* Teacher ID — read only */}
              {teacherId && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280',
                    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    Teacher ID
                  </label>
                  <input type="text" value={teacherId} disabled
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB',
                      borderRadius: 12, fontSize: 14, background: '#F9FAFB', color: '#9CA3AF',
                      cursor: 'not-allowed', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* Email — read only */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280',
                  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Email Address
                </label>
                <input type="email" value={email} disabled
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB',
                    borderRadius: 12, fontSize: 14, background: '#F9FAFB', color: '#9CA3AF',
                    cursor: 'not-allowed', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '6px 0 0' }}>
                  Linked to your Google account — cannot be changed.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <button type="submit" disabled={saving} style={{
                  flex: 1, padding: '12px', background: saving ? '#FED7AA' : '#F97316', color: 'white',
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => router.push('/teacher/dashboard')} style={{
                  padding: '12px 20px', background: '#F3F4F6', color: '#374151',
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </AppShell>
    </>
  )
}
