'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'

const MIN = 50

function Field({ label, name, value, onChange, rows=4, placeholder, required, hint }: {
  label:string; name:string; value:string
  onChange:(e:React.ChangeEvent<HTMLTextAreaElement>)=>void
  rows?:number; placeholder?:string; required?:boolean
  hint?: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required&&<span className="text-red-500 normal-case tracking-normal">*</span>}
      </label>
      <textarea id={name} name={name} value={value} onChange={onChange} rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
          transition-all resize-y placeholder:text-gray-400" />
      {hint && <div className="mt-1.5">{hint}</div>}
    </div>
  )
}

export default function CreateNarrativePage() {
  const router = useRouter()
  const [busy, setBusy]       = useState(false)
  const [draft, setDraft]     = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm]       = useState({
    date: new Date().toISOString().split('T')[0],
    activity:'', narrative:'', learnings:'',
    skills:'', challenges:'', solutions:'', reflection:'',
  })

  const handle = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    setForm(p=>({...p,[e.target.name]:e.target.value})); setError('')
  }

  const submit = async (isDraft: boolean) => {
    setError(''); setSuccess('')
    if(!isDraft && form.narrative.trim().length < MIN) {
      setError(`Narrative needs at least ${MIN} characters.`); return
    }
    isDraft ? setDraft(true) : setBusy(true)
    try {
      const content = [
        `**Activity:** ${form.activity||'Not specified'}`,
        `\n**Narrative:**\n${form.narrative}`,
        `\n**What I Learned:**\n${form.learnings||'Not specified'}`,
        `\n**Skills Demonstrated:**\n${form.skills||'Not specified'}`,
        `\n**Challenges:**\n${form.challenges||'Not specified'}`,
        `\n**How I Handled It:**\n${form.solutions||'Not specified'}`,
        `\n**Reflection:**\n${form.reflection||'Not specified'}`,
      ].join('\n')

      const res = await fetch('/api/narratives', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ date: new Date(form.date).toISOString(), content, isDraft }),
      })
      if(!res.ok){ const d=await res.json(); throw new Error(d.error) }
      setSuccess(isDraft?'Draft saved!':'Narrative submitted!')
      setTimeout(()=>router.push('/narratives'),1200)
    } catch(e:unknown){ setError(e instanceof Error?e.message:'An error occurred') }
    finally { setBusy(false); setDraft(false) }
  }

  const chars = form.narrative.length
  const ready = chars >= MIN

  return (
    <AppShell>
      <PageHeader
        title="New Narrative Assessment"
        subtitle="Document your daily work immersion activities"
        backHref="/narratives" backLabel="Narratives"
      />

      <div className="max-w-3xl space-y-5">
        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl
            text-sm text-red-700 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl
            text-sm text-emerald-700 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            {success}
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="max-w-xs">
              <Input label="Date of Activity" type="date" name="date" value={form.date}
                onChange={handle} max={new Date().toISOString().split('T')[0]} required />
            </div>
            <Input label="Activity / Task Title" type="text" name="activity" value={form.activity}
              onChange={handle} placeholder="e.g. Customer Service Training" maxLength={200} />
          </div>

          <Field label="Narrative Description" name="narrative" value={form.narrative}
            onChange={handle} rows={8} required
            placeholder="Describe in detail what you did, tasks completed, and observations..."
            hint={
              <div className="flex justify-between text-xs">
                <span className={ready?'text-emerald-600 font-medium':'text-gray-400'}>
                  {ready ? `Ready (${chars} chars)` : `${MIN-chars} more characters needed`}
                </span>
                <span className="text-gray-400">{chars}</span>
              </div>
            }
          />
          <Field label="What I Learned" name="learnings" value={form.learnings}
            onChange={handle} rows={3} placeholder="New knowledge or insights gained today..." />
          <Field label="Skills Demonstrated" name="skills" value={form.skills}
            onChange={handle} rows={3} placeholder="Skills you used or developed..." />
          <Field label="Challenges Encountered" name="challenges" value={form.challenges}
            onChange={handle} rows={3} placeholder="Difficulties or obstacles faced..." />
          <Field label="How I Handled It" name="solutions" value={form.solutions}
            onChange={handle} rows={3} placeholder="How you overcame challenges..." />
          <Field label="Personal Reflection" name="reflection" value={form.reflection}
            onChange={handle} rows={4} placeholder="Your thoughts and insights about today..." />

          {/* Notice */}
          <div className="flex gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <ul className="space-y-0.5 list-disc list-inside leading-relaxed">
              <li>Submission timestamp is recorded automatically</li>
              <li>Save as draft if you need to continue later</li>
              <li>Submitted narratives are reviewed by your supervisor</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button type="button" variant="outline" size="lg" className="flex-1"
              isLoading={draft} disabled={busy} onClick={()=>submit(true)}>
              Save as Draft
            </Button>
            <Button type="button" size="lg" className="flex-1"
              isLoading={busy} disabled={draft||!ready} onClick={()=>submit(false)}>
              Submit Narrative
            </Button>
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Writing Guidelines</h3>
          <ul className="space-y-1.5 text-sm text-gray-500">
            {['Be specific and detailed about your activities',
              'Use complete sentences and proper grammar',
              'Focus on what you learned and how you contributed',
              'Reflect honestly and thoughtfully',
              `Minimum ${MIN} characters for the narrative section`,
            ].map(tip=>(
              <li key={tip} className="flex gap-2">
                <span className="text-indigo-400 flex-shrink-0 mt-0.5">&#8226;</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
