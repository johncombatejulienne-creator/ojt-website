'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppShell from '@/components/AppShell'

/* ─── FAQ data ───────────────────────────────────────────── */
const FAQS = [
  { q: 'What should I write in my daily narrative?', a: 'Describe the tasks you performed, what you observed, what you learned, any challenges you faced, and your personal reflection. Be specific and use complete sentences.' },
  { q: 'Can I edit my narrative after saving it?', a: 'Yes — drafts can be edited at any time. Once submitted, you can still view and download it, but you cannot edit a submitted narrative. Contact your teacher if you need changes after submission.' },
  { q: 'What is the difference between Draft and Submitted?', a: 'A Draft is saved but not yet sent for review. Only you can see it. Submitted means your teacher can now see and review your narrative.' },
  { q: 'How do I know if my teacher reviewed my narrative?', a: 'You will receive a notification when your teacher reviews it. The status badge on your narrative will change to "Approved" or "Revision Needed."' },
  { q: 'What happens if my narrative needs revision?', a: 'Your teacher will leave feedback explaining what needs to be changed. Check the narrative detail page to read the feedback.' },
  { q: 'How do I upload a Work Immersion photo?', a: 'After submitting your narrative, the app will open your camera for a verification selfie. This photo is automatically stamped with your name, date, and time.' },
  { q: 'How do I check my progress?', a: 'Go to your Dashboard. The progress section shows how many checklist requirements you have completed. Each stat card also shows narrative counts.' },
  { q: 'Can I access my narratives on my phone?', a: 'Yes! The website is fully mobile-responsive. You can write, submit, and download narratives from any device with a browser.' },
  { q: 'Why is my verification photo required?', a: 'The verification selfie confirms that you personally submitted the narrative at the recorded time and date. It is a tamper-proof record of your submission.' },
  { q: 'What should I do if I encounter an error?', a: 'Try refreshing the page first. If the problem persists, note the error message and contact your teacher or the school administrator.' },
]

/* ─── Section heading ────────────────────────────────────── */
function SectionTitle({ id, icon, title, subtitle }: { id: string; icon: string; title: string; subtitle?: string }) {
  return (
    <div id={id} style={{ scrollMarginTop: 80, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#F97316,#FBBF24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111827', margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ height: 2, background: 'linear-gradient(90deg,#F97316,transparent)', marginTop: 14, borderRadius: 999 }} />
    </div>
  )
}

/* ─── Guide card ─────────────────────────────────────────── */
function GuideCard({ icon, title, steps }: { icon: string; title: string; steps: string[] }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#FFFFFF,#FFFCF5)', borderRadius: 16, border: '1px solid #FEE9C5', padding: '18px 20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>{title}</h3>
      </div>
      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((s, i) => (
          <li key={i} style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{s}</li>
        ))}
      </ol>
    </div>
  )
}

/* ─── Status badge explain ───────────────────────────────── */
const STATUS_EXPLANATIONS = [
  { status: 'Draft',            bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB',
    desc: 'Your narrative is saved but has NOT been submitted for review. Only you can see it.' },
  { status: 'Pending Review',   bg: '#FFFBEB', color: '#92400E', border: '#FDE68A',
    desc: 'Your narrative has been submitted and is waiting for your teacher to review it.' },
  { status: 'Approved',         bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0',
    desc: 'Your teacher has reviewed and approved your narrative. Well done!' },
  { status: 'Revision Needed',  bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA',
    desc: 'Your teacher requested changes. Open the narrative to read the feedback and make corrections.' },
]

/* ─── FAQ accordion ──────────────────────────────────────── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(v => !v)}>
        <span>{q}</span>
        <svg style={{ width: 18, height: 18, color: '#9CA3AF', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <div className={`faq-answer ${open ? 'open' : ''}`}>{a}</div>
    </div>
  )
}

/* ─── Search filter state ────────────────────────────────── */

/* ════════════════════════════════════════════════════════════
   PAGE
═════════════════════════════════════════════════════════════ */
export default function HelpPage() {
  const router = useRouter()
  const [faqSearch, setFaqSearch] = useState('')

  const filteredFaqs = FAQS.filter(f =>
    !faqSearch.trim() ||
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.a.toLowerCase().includes(faqSearch.toLowerCase())
  )

  return (
    <AppShell>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ maxWidth: 760, animation: 'fadeSlideUp 0.4s ease both' }}>

        {/* ── Back ──────────────────────────────────────── */}
        <button onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9CA3AF',
            background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20,
            padding: '4px 0', fontFamily: 'inherit', transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F97316' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}>
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        {/* ── Hero ──────────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg,#1E293B,#0F172A)', borderRadius: 22,
          padding: '32px 28px', marginBottom: 28, color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Help Center</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 10px' }}>
              How to Use the Narrative Tracker
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: '0 0 20px', lineHeight: 1.7 }}>
              Everything you need to document your Work Immersion journey — from your first day to completion.
            </p>
            {/* Quick nav */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'Getting Started', href: '#start' },
                { label: 'Narratives',      href: '#narratives' },
                { label: 'Status Guide',    href: '#status' },
                { label: 'Writing Tips',    href: '#writing' },
                { label: 'FAQs',            href: '#faq' },
              ].map(({ label, href }) => (
                <a key={label} href={href}
                  style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, color: 'white',
                    fontSize: 12, fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.22)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            GETTING STARTED
        ═══════════════════════════════════════════════ */}
        <SectionTitle id="start" icon="🚀" title="Getting Started"
          subtitle="Your first steps with the Work Immersion Narrative Tracker" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
          <GuideCard icon="🏠" title="Using the Dashboard" steps={[
            'Open the dashboard to see your overall progress at a glance.',
            'The progress circle shows your requirement completion percentage.',
            'Stat cards show total narratives, this week\'s entries, pending reviews, and requirements.',
            'Use Quick Actions to navigate to key areas of the app.',
          ]} />
          <GuideCard icon="✍️" title="Creating a Narrative" steps={[
            'Tap "New Narrative" on the dashboard or the + button.',
            'Fill in the date, activity title, and narrative fields.',
            'The other fields (learnings, challenges, reflection) are optional but encouraged.',
            'Click "Submit & Take Verification Photo" when done.',
            'Take a quick selfie to confirm your submission.',
          ]} />
          <GuideCard icon="💾" title="Saving as Draft" steps={[
            'Not finished writing? Click "Save as Draft."',
            'Your draft is saved securely — nothing will be lost.',
            'Find it in My Narratives under the "Drafts" filter.',
            'Click "Continue" on the draft card to resume editing.',
          ]} />
          <GuideCard icon="📥" title="Downloading Narratives" steps={[
            'After submitting, a download button appears automatically.',
            'You can also download from the narrative detail page or the narratives list.',
            'Keep a copy for your personal records and printed submission.',
          ]} />
        </div>

        {/* ════════════════════════════════════════════════
            NARRATIVES
        ═══════════════════════════════════════════════ */}
        <SectionTitle id="narratives" icon="📖" title="Managing Narratives"
          subtitle="View, edit, submit, and track your daily entries" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
          <GuideCard icon="🔍" title="Finding a Narrative" steps={[
            'Go to My Narratives from the navigation.',
            'Use the search bar to find by title, content, or date.',
            'Use filter tabs: All, Submitted, or Drafts.',
          ]} />
          <GuideCard icon="👁" title="Viewing a Narrative" steps={[
            'Click "View" on any narrative card.',
            'The detail page shows all sections of your entry.',
            'The verification photo is shown if one was taken.',
            'Teacher feedback (if any) appears at the bottom.',
          ]} />
          <GuideCard icon="📊" title="Checking Narrative Status" steps={[
            'Each narrative card has a status badge.',
            'Hover over the badge to see what the status means.',
            'Check notifications for updates from your teacher.',
          ]} />
        </div>

        {/* ════════════════════════════════════════════════
            STATUS EXPLANATIONS
        ═══════════════════════════════════════════════ */}
        <SectionTitle id="status" icon="🏷️" title="Understanding Statuses"
          subtitle="What each status badge means for your narratives" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {STATUS_EXPLANATIONS.map(s => (
            <div key={s.status} style={{ display: 'flex', alignItems: 'flex-start', gap: 14,
              background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
              padding: '14px 18px', boxSizing: 'border-box' }}>
              <span style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                whiteSpace: 'nowrap', flexShrink: 0 }}>{s.status}</span>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════
            WRITING GUIDE
        ═══════════════════════════════════════════════ */}
        <SectionTitle id="writing" icon="✍️" title="Writing a Good Narrative"
          subtitle="Tips for producing clear, detailed, and reflective narratives" />
        <div style={{ background: 'linear-gradient(135deg,#FFFFFF,#FFFCF5)', borderRadius: 18, border: '1px solid #FEE9C5',
          padding: '22px 24px', marginBottom: 32, boxSizing: 'border-box' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { icon: '🎯', title: 'Be Specific', body: 'Mention the actual tasks, tools, and processes you worked with. Avoid vague statements like "I helped the team."' },
              { icon: '📏', title: 'Required Length', body: `Your narrative description needs at least 50 characters. Aim for 2–4 paragraphs to fully describe your experience.` },
              { icon: '🪞', title: 'Reflect Honestly', body: 'The reflection section is your chance to think critically — what worked, what didn\'t, and what you would do differently.' },
              { icon: '📝', title: 'Fill All Sections', body: 'While only the narrative is required, filling in all sections (learnings, challenges, reflection) helps your teacher give better feedback.' },
              { icon: '🕒', title: 'Submit Daily', body: 'Try to submit on the same day as your work experience. Late submissions are recorded and may affect your evaluation.' },
              { icon: '💬', title: 'Grammar Matters', body: 'Use complete sentences and correct grammar. Proofread before submitting — this is an official record of your experience.' },
            ].map(({ icon, title, body }) => (
              <div key={title}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', margin: 0 }}>{title}</p>
                </div>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════════ */}
        <SectionTitle id="faq" icon="❓" title="Frequently Asked Questions"
          subtitle="Quick answers to common questions" />

        {/* FAQ search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 15, height: 15, color: '#9CA3AF', pointerEvents: 'none' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input type="text" value={faqSearch} onChange={e => setFaqSearch(e.target.value)}
            placeholder="Search frequently asked questions…"
            className="search-input" style={{ paddingLeft: 38 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
          {filteredFaqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>
              No questions match "{faqSearch}"
            </div>
          ) : (
            filteredFaqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)
          )}
        </div>

        {/* ── Contact strip ──────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', borderRadius: 16,
          border: '1px solid #A7F3D0', padding: '20px 24px', display: 'flex',
          alignItems: 'center', gap: 16, flexWrap: 'wrap', boxSizing: 'border-box' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
            💬
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#065F46', margin: '0 0 3px' }}>
              Still have questions?
            </p>
            <p style={{ fontSize: 13, color: '#059669', margin: 0 }}>
              Talk to your teacher or school coordinator for help with your Work Immersion account.
            </p>
          </div>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '9px 18px', background: '#10B981', color: 'white', border: 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0 }}>
            Back to Dashboard
          </button>
        </div>

      </div>
    </AppShell>
  )
}
