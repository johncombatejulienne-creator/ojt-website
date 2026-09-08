'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/* ─── Types ─────────────────────────────────────────── */
interface Strand { id: string; name: string }
interface Section { id: string; name: string; gradeLevel: number }

type ToastKind = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; kind: ToastKind }

/* ─── Toast helper ───────────────────────────────────── */
function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-left
            ${t.kind === 'success' ? 'bg-green-600 text-white' : ''}
            ${t.kind === 'error'   ? 'bg-red-600 text-white'   : ''}
            ${t.kind === 'info'    ? 'bg-blue-600 text-white'  : ''}
          `}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      ))}
    </div>
  )
}

/* ─── Avatar component ───────────────────────────────── */
function Avatar({
  src,
  name,
  size = 96,
}: {
  src?: string | null
  name?: string | null
  size?: number
}) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (src) {
    return (
      <div
        className="rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt="Profile picture"
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized={src.startsWith('data:')}
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold border-4 border-white shadow-lg flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initials}
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────── */
export default function EditProfilePage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()

  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [strands, setStrands]     = useState<Strand[]>([])
  const [sections, setSections]   = useState<Section[]>([])
  const [toasts, setToasts]       = useState<Toast[]>([])
  const toastCounter              = useRef(0)

  // Profile picture state
  const [currentPicture, setCurrentPicture] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl]         = useState<string | null>(null)
  const [selectedFile, setSelectedFile]     = useState<File | null>(null)
  const [uploadingPic, setUploadingPic]     = useState(false)
  const fileInputRef                         = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    strandId: '',
    sectionId: '',
    company: '',
    course: '',
    gradeLevel: 12,
  })

  /* ── Toast helpers ──────────────────────────────────── */
  const addToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, message, kind }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /* ── Auth guard ─────────────────────────────────────── */
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  /* ── Load data ──────────────────────────────────────── */
  useEffect(() => {
    if (!session?.user) return

    const load = async () => {
      try {
        const [profileRes, strandsRes] = await Promise.all([
          fetch('/api/students/profile'),
          fetch('/api/strands'),
        ])

        if (profileRes.ok) {
          const { student } = await profileRes.json()
          setFormData({
            name:       student.name        ?? '',
            studentId:  student.studentId   ?? '',
            strandId:   student.strandId    ?? '',
            sectionId:  student.sectionId   ?? '',
            company:    student.company     ?? '',
            course:     student.course      ?? '',
            gradeLevel: student.gradeLevel  ?? 12,
          })
          setCurrentPicture(student.profilePicture ?? session.user.profilePicture ?? null)
        }

        if (strandsRes.ok) {
          const { strands } = await strandsRes.json()
          setStrands(strands ?? [])
        }
      } catch {
        addToast('Failed to load profile data.', 'error')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [session, addToast])

  /* ── Load sections when strand changes ─────────────── */
  useEffect(() => {
    if (!formData.strandId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSections([])
      return
    }
    let cancelled = false
    fetch(`/api/sections?strandId=${formData.strandId}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setSections(d.sections ?? []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [formData.strandId])

  /* ── Profile picture selection ──────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      addToast('Please select a JPG, PNG, WebP, or GIF image.', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast('Image must be smaller than 2 MB.', 'error')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  /* ── Upload picture ─────────────────────────────────── */
  const handleUploadPicture = async () => {
    if (!selectedFile) return
    setUploadingPic(true)
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)

      const res = await fetch('/api/students/profile-picture', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setCurrentPicture(data.profilePicture)
      setPreviewUrl(null)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Refresh session so Header updates too
      await updateSession({ profilePicture: data.profilePicture })
      addToast('Profile picture updated!', 'success')
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to upload picture.', 'error')
    } finally {
      setUploadingPic(false)
    }
  }

  /* ── Remove picture ─────────────────────────────────── */
  const handleRemovePicture = async () => {
    setUploadingPic(true)
    try {
      const res = await fetch('/api/students/profile-picture', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove picture')
      setCurrentPicture(null)
      setPreviewUrl(null)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await updateSession({ profilePicture: null })
      addToast('Profile picture removed.', 'info')
    } catch {
      addToast('Failed to remove picture.', 'error')
    } finally {
      setUploadingPic(false)
    }
  }

  /* ── Save profile info ──────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { addToast('Full name is required.', 'error'); return }
    if (!formData.studentId.trim()) { addToast('Student ID is required.', 'error'); return }
    if (!formData.strandId) { addToast('Please select a strand.', 'error'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/students/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')

      addToast('Profile updated successfully!', 'success')

      // Small delay so user sees toast before redirect
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Loading state ──────────────────────────────────── */
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading profile…</p>
        </div>
      </div>
    )
  }

  const displayPicture = previewUrl ?? currentPicture

  return (
    <>
      <ToastList toasts={toasts} remove={removeToast} />

      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Back + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-700 font-medium">Edit Profile</span>
          </div>

          {/* ── Profile Picture Card ─────────────────────── */}
          <Card>
            <CardHeader padding="lg" divider>
              <CardTitle level={3}>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent padding="lg">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar preview */}
                <div className="relative flex-shrink-0">
                  <Avatar src={displayPicture} name={formData.name || session?.user?.name} size={100} />
                  {displayPicture && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {previewUrl && (
                    <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow">
                      Preview
                    </div>
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex-1 w-full space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                    id="picture-upload"
                    aria-label="Upload profile picture"
                  />

                  {!previewUrl ? (
                    <label
                      htmlFor="picture-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-purple-400 hover:text-purple-600 cursor-pointer transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose a photo
                    </label>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUploadPicture}
                        isLoading={uploadingPic}
                        size="sm"
                        variant="primary"
                        className="flex-1"
                      >
                        Save Photo
                      </Button>
                      <Button
                        onClick={() => { setPreviewUrl(null); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                        size="sm"
                        variant="outline"
                        disabled={uploadingPic}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {currentPicture && !previewUrl && (
                    <Button
                      onClick={handleRemovePicture}
                      isLoading={uploadingPic}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Photo
                    </Button>
                  )}

                  <p className="text-xs text-gray-400 text-center">
                    JPG, PNG, WebP or GIF · Max 2 MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Profile Info Card ────────────────────────── */}
          <Card>
            <CardHeader padding="lg" divider>
              <CardTitle level={3}>Personal Information</CardTitle>
            </CardHeader>
            <CardContent padding="lg">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name */}
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Juan Dela Cruz"
                />

                {/* Student ID */}
                <Input
                  label="Student ID"
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                  placeholder="2024-12345"
                  helperText="Your school-assigned student ID number"
                />

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={session?.user?.email ?? ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Linked to your Google account — cannot be changed.</p>
                </div>

                {/* Grade Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Grade Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value={11}>Grade 11</option>
                    <option value={12}>Grade 12</option>
                  </select>
                </div>

                {/* Strand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Strand <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.strandId}
                    onChange={(e) => setFormData({ ...formData, strandId: e.target.value, sectionId: '' })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select your strand</option>
                    {strands.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Section
                  </label>
                  <select
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    disabled={!formData.strandId || sections.length === 0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">{!formData.strandId ? 'Select a strand first' : 'Select your section'}</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <hr className="border-gray-100" />

                {/* Work Immersion Details */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Immersion Details</p>

                <Input
                  label="Company / Establishment"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="ABC Company"
                  helperText="Where you are doing your work immersion"
                />

                <Input
                  label="Course / Program"
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g. Computer Science"
                />

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    isLoading={saving}
                    className="flex-1"
                    size="lg"
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    disabled={saving}
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  )
}
