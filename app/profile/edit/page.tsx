'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/* ─── Toast ───────────────────────────────────────────── */
type ToastKind = 'success'|'error'|'info'
interface Toast { id: number; msg: string; kind: ToastKind }

function Toasts({ list, remove }: { list: Toast[]; remove:(id:number)=>void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {list.map(t => (
        <div key={t.id} className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm
          font-medium animate-slide-left pointer-events-auto
          ${t.kind==='success'?'bg-emerald-600 text-white':t.kind==='error'?'bg-red-600 text-white':'bg-slate-800 text-white'}`}>
          <span className="flex-1 leading-snug">{t.msg}</span>
          <button onClick={()=>remove(t.id)} className="opacity-70 hover:opacity-100 text-lg leading-none flex-shrink-0">×</button>
        </div>
      ))}
    </div>
  )
}

/* ─── Avatar preview ──────────────────────────────────── */
function AvatarPreview({ src, name, size=88 }: { src?:string|null; name?:string|null; size?:number }) {
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?'
  if (src) return (
    <div className="rounded-2xl overflow-hidden ring-4 ring-white shadow-lg flex-shrink-0"
      style={{width:size,height:size}}>
      <Image src={src} alt="Profile" width={size} height={size}
        className="object-cover w-full h-full" unoptimized={src.startsWith('data:')} />
    </div>
  )
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
      flex items-center justify-center text-white font-black ring-4 ring-white shadow-lg flex-shrink-0"
      style={{width:size,height:size,fontSize:Math.round(size*0.34)}}>
      {initials}
    </div>
  )
}

interface Strand { id:string; name:string }
interface Section { id:string; name:string; gradeLevel:number }

export default function EditProfilePage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [strands, setStrands]   = useState<Strand[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [useCustomSection, setUseCustomSection] = useState(false)
  const [customSection, setCustomSection] = useState('')
  const [toasts, setToasts]     = useState<Toast[]>([])
  const counter = useRef(0)

  const [pic, setPic]           = useState<string|null>(null)
  const [preview, setPreview]   = useState<string|null>(null)
  const [file, setFile]         = useState<File|null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name:'', studentId:'', strandId:'', sectionId:'',
    company:'', course:'', gradeLevel:12,
  })

  const toast = useCallback((msg:string, kind:ToastKind='info') => {
    const id = ++counter.current
    setToasts(p=>[...p,{id,msg,kind}])
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000)
  },[])

  useEffect(()=>{
    if(status==='unauthenticated') router.push('/login')
  },[status,router])

  useEffect(()=>{
    if(!session?.user) return
    const load = async () => {
      try {
        const [pRes,sRes] = await Promise.all([fetch('/api/students/profile'),fetch('/api/strands')])
        if(pRes.ok){ const {student:s}=await pRes.json()
          setForm({name:s.name??'',studentId:s.studentId??'',strandId:s.strandId??'',
            sectionId:s.sectionId??'',company:s.company??'',course:s.course??'',gradeLevel:s.gradeLevel??12})
          setPic(s.profilePicture??session.user.profilePicture??null)
        }
        if(sRes.ok){ const {strands:ss}=await sRes.json(); setStrands(ss??[]) }
      } catch { toast('Failed to load profile','error') }
      finally { setLoading(false) }
    }; load()
  },[session,toast])

  useEffect(()=>{
    if(!form.strandId){setSections([]);return}
    let cancelled=false
    fetch(`/api/sections?strandId=${form.strandId}`)
      .then(r=>r.json()).then(d=>{if(!cancelled)setSections(d.sections??[])}).catch(()=>{})
    return()=>{cancelled=true}
  },[form.strandId])

  const handleFile = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if(!f) return
    if(!['image/jpeg','image/png','image/webp','image/gif'].includes(f.type)){
      toast('Use JPG, PNG, WebP or GIF','error'); return
    }
    if(f.size>2*1024*1024){toast('Max 2 MB','error'); return}
    setFile(f)
    const r=new FileReader(); r.onload=ev=>setPreview(ev.target?.result as string); r.readAsDataURL(f)
  }

  const uploadPic = async () => {
    if(!file) return; setUploading(true)
    try {
      const fd=new FormData(); fd.append('file',file)
      const res=await fetch('/api/students/profile-picture',{method:'POST',body:fd})
      const data=await res.json()
      if(!res.ok) throw new Error(data.error)
      setPic(data.profilePicture); setPreview(null); setFile(null)
      if(fileRef.current) fileRef.current.value=''
      await updateSession({profilePicture:data.profilePicture})
      toast('Photo updated!','success')
    } catch(e:unknown){ toast(e instanceof Error?e.message:'Upload failed','error') }
    finally { setUploading(false) }
  }

  const removePic = async () => {
    setUploading(true)
    try {
      const res=await fetch('/api/students/profile-picture',{method:'DELETE'})
      if(!res.ok) throw new Error('Failed')
      setPic(null); setPreview(null); setFile(null)
      if(fileRef.current) fileRef.current.value=''
      await updateSession({profilePicture:null})
      toast('Photo removed','info')
    } catch { toast('Failed to remove','error') }
    finally { setUploading(false) }
  }

  const handleSave = async (e:React.FormEvent) => {
    e.preventDefault()
    if(!form.name.trim()){toast('Full name required','error');return}
    if(!form.studentId.trim()){toast('Student ID required','error');return}
    setSaving(true)
    try {
      const body = {
        ...form,
        // If using custom section, send sectionName and clear sectionId
        ...(useCustomSection && customSection.trim()
          ? { sectionId: '', sectionName: customSection.trim() }
          : {}),
      }
      const res=await fetch('/api/students/profile',{method:'PUT',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      const data=await res.json()
      if(!res.ok) throw new Error(data.error)
      toast('Profile saved!','success')
      setTimeout(()=>router.push('/dashboard'),1200)
    } catch(e:unknown){ toast(e instanceof Error?e.message:'Save failed','error') }
    finally { setSaving(false) }
  }

  if(loading||status==='loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )

  const displayPic = preview ?? pic

  return (
    <>
      <Toasts list={toasts} remove={id=>setToasts(p=>p.filter(t=>t.id!==id))} />

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Breadcrumb */}
          <button onClick={()=>router.push('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Dashboard
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Update your personal information and photo.</p>
          </div>

          {/* Photo card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Profile Picture</h2>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative">
                <AvatarPreview src={displayPic} name={form.name||session?.user?.name} size={88} />
                {preview && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-900
                    text-xs font-bold px-1.5 py-0.5 rounded-full shadow">Preview</span>
                )}
              </div>

              <div className="flex-1 w-full space-y-3">
                <input ref={fileRef} type="file" id="pic-upload" className="hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} />

                {!preview ? (
                  <label htmlFor="pic-upload"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4
                      border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500
                      hover:border-indigo-400 hover:text-indigo-600 cursor-pointer transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    Choose a photo
                  </label>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={uploadPic} isLoading={uploading} size="sm" className="flex-1">Save Photo</Button>
                    <Button onClick={()=>{setPreview(null);setFile(null);if(fileRef.current)fileRef.current.value=''}}
                      variant="outline" size="sm" disabled={uploading}>Cancel</Button>
                  </div>
                )}

                {pic && !preview && (
                  <Button onClick={removePic} isLoading={uploading} variant="ghost" size="sm" fullWidth
                    className="text-red-600 hover:bg-red-50 hover:text-red-700">
                    Remove Photo
                  </Button>
                )}
                <p className="text-xs text-gray-400 text-center">JPG, PNG, WebP or GIF &middot; Max 2 MB</p>
              </div>
            </div>
          </div>

          {/* Info form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Personal Information</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" type="text" value={form.name} required placeholder="Juan Dela Cruz"
                  onChange={e=>setForm({...form,name:e.target.value})} />
                <Input label="Student ID" type="text" value={form.studentId} required placeholder="2024-12345"
                  onChange={e=>setForm({...form,studentId:e.target.value})}
                  helperText="Your school-assigned ID" />
              </div>

              {/* Email read-only */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input type="email" value={session?.user?.email??''} disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                    text-gray-400 text-sm cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Linked to your Google account.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Grade */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Grade Level
                  </label>
                  <select value={form.gradeLevel} onChange={e=>setForm({...form,gradeLevel:Number(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400">
                    <option value={11}>Grade 11</option>
                    <option value={12}>Grade 12</option>
                  </select>
                </div>
                {/* Strand */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Strand
                  </label>
                  <select value={form.strandId}
                    onChange={e=>setForm({...form,strandId:e.target.value,sectionId:''})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400">
                    <option value="">Select strand</option>
                    {strands.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Section */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Section
                </label>
                {/* Toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  {(['list','custom'] as const).map(mode => (
                    <button key={mode} type="button"
                      onClick={() => setUseCustomSection(mode === 'custom')}
                      style={{
                        padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: (mode === 'custom') === useCustomSection ? '#F97316' : '#F3F4F6',
                        color: (mode === 'custom') === useCustomSection ? 'white' : '#6B7280',
                      }}>
                      {mode === 'list' ? 'Select from List' : 'Type My Section'}
                    </button>
                  ))}
                </div>
                {!useCustomSection ? (
                  <select value={form.sectionId} onChange={e=>setForm({...form,sectionId:e.target.value})}
                    disabled={!form.strandId}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
                      disabled:bg-gray-50 disabled:text-gray-400">
                    <option value="">{!form.strandId?'Select a strand first':'Select your section'}</option>
                    {sections.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <>
                    <input type="text" value={customSection}
                      onChange={e => setCustomSection(e.target.value)}
                      placeholder="e.g. Einstein, 12-STEM-1, Section A"
                      disabled={!form.strandId}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                        focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400
                        disabled:bg-gray-50 disabled:text-gray-400" />
                    <p className="text-xs text-gray-400 mt-1">Students with the same section name will be grouped together in the teacher dashboard.</p>
                  </>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Work Immersion Details
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Company / Establishment" type="text" value={form.company}
                    onChange={e=>setForm({...form,company:e.target.value})}
                    placeholder="ABC Company" />
                  <Input label="Course / Program" type="text" value={form.course}
                    onChange={e=>setForm({...form,course:e.target.value})}
                    placeholder="e.g. Computer Science" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={saving} size="lg" className="flex-1">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" size="lg"
                  onClick={()=>router.push('/dashboard')} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
