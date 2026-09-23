'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HelpButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const items = [
    { icon: '📖', label: 'How to Use',     path: '/help' },
    { icon: '❓', label: 'FAQs',            path: '/help#faq' },
    { icon: '✍️', label: 'Writing Guide',   path: '/help#writing' },
    { icon: '📊', label: 'Status Guide',    path: '/help#status' },
  ]

  return (
    <div ref={ref} style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 100 }}>
      <style>{`
        @keyframes helpMenuIn{from{opacity:0;transform:translateY(10px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {open && (
        <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 12,
          background: 'white', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          border: '1px solid #E5E7EB', overflow: 'hidden', minWidth: 180,
          animation: 'helpMenuIn 0.2s cubic-bezier(0.34,1.3,0.64,1) both' }}>
          <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)',
            borderBottom: '1px solid #FED7AA' }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#92400E', margin: 0 }}>❓ Help & Guides</p>
          </div>
          {items.map(item => (
            <button key={item.label}
              onClick={() => { router.push(item.path); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#374151',
                textAlign: 'left', transition: 'background 0.12s', borderBottom: '1px solid #F9FAFB' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFF7ED' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <button onClick={() => setOpen(v => !v)}
        style={{ width: 52, height: 52, borderRadius: '50%',
          background: open ? '#1E293B' : 'linear-gradient(135deg,#F97316,#EA580C)',
          border: 'none', cursor: 'pointer', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? '0 4px 16px rgba(0,0,0,0.25)' : '0 6px 20px rgba(249,115,22,0.45)',
          transition: 'all 0.25s cubic-bezier(0.34,1.3,0.64,1)',
          transform: open ? 'scale(1.1)' : 'scale(1)',
          fontSize: 20 }}
        aria-label="Help">
        {open ? '×' : '?'}
      </button>
    </div>
  )
}
