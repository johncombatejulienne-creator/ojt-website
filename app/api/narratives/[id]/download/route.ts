import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/narratives/[id]/download
 * Returns the full narrative as a downloadable HTML file styled as a professional document.
 * The browser will download it; students/teachers can print to PDF or save as HTML.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    const narrative = await prisma.narrative.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            name: true, studentId: true, email: true,
            company: true, gradeLevel: true,
            strand:  { select: { name: true } },
            section: { select: { name: true } },
            supervisor: { select: { name: true } },
          },
        },
        photos: { select: { url: true, uploadedAt: true, isVerified: true } },
      },
    })

    if (!narrative) {
      return new NextResponse('Narrative not found', { status: 404 })
    }

    // Authorization: student can only download their own
    if (session.user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { email: session.user.email }, select: { id: true },
      })
      if (!student || narrative.studentId !== student.id) {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }

    const s = narrative.student
    const submissionDateStr = narrative.submissionDate
      ? new Date(narrative.submissionDate).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : new Date(narrative.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })

    const narrativeDateStr = new Date(narrative.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    // Format the content — convert markdown-style bold to HTML
    const formatContent = (text: string) =>
      text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')

    const content = formatContent(narrative.content)

    // Verification photo HTML
    const verificationPhotoHtml = narrative.photos.length > 0
      ? `
        <div class="section">
          <h2 class="section-title">Verification Photo</h2>
          <div style="text-align:center; margin: 20px 0;">
            <img src="${narrative.photos[0].url}" alt="Verification Photo"
              style="max-width:400px; max-height:400px; border:2px solid #e5e7eb; border-radius:8px;" />
            <p style="margin-top:8px; color:#6b7280; font-size:12px;">
              Captured on ${new Date(narrative.photos[0].uploadedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>`
      : ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Work Immersion Narrative — ${s?.name ?? 'Student'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #111;
      background: white;
    }
    .page {
      max-width: 816px;
      margin: 0 auto;
      padding: 72px 72px 96px;
    }
    .school-header {
      text-align: center;
      border-bottom: 3px double #1a1a1a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .school-name {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .school-subtitle {
      font-size: 10pt;
      color: #555;
      margin-top: 4px;
    }
    .doc-title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 20px 0 28px;
      color: #1a1a1a;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 32px;
      margin-bottom: 28px;
      border: 1px solid #ccc;
      padding: 16px 20px;
      background: #fafafa;
    }
    .info-row {
      display: flex;
      gap: 8px;
    }
    .info-label {
      font-weight: bold;
      white-space: nowrap;
      min-width: 120px;
    }
    .info-value {
      color: #333;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #aaa;
      padding-bottom: 4px;
      margin-bottom: 12px;
      color: #1a1a1a;
    }
    .content-body {
      text-align: justify;
      hyphens: auto;
    }
    .content-body p {
      margin-bottom: 12px;
      text-indent: 36px;
    }
    .footer {
      margin-top: 48px;
      border-top: 1px solid #ccc;
      padding-top: 16px;
      text-align: center;
      font-size: 9pt;
      color: #888;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .status-approved  { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .status-pending   { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .status-revision  { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    @media print {
      body { font-size: 11pt; }
      .page { padding: 48px 48px 72px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- School Header -->
    <div class="school-header">
      <div class="school-name">Paete Science and Business College Inc.</div>
      <div class="school-subtitle">Paete, Laguna · Est. 2009</div>
      <div class="school-subtitle" style="margin-top:4px">Senior High School — Work Immersion Program</div>
    </div>

    <!-- Document Title -->
    <div class="doc-title">Daily Narrative Report</div>

    <!-- Student Info -->
    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">Student Name:</span>
        <span class="info-value">${s?.name ?? '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Student ID:</span>
        <span class="info-value">${s?.studentId ?? '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Grade Level:</span>
        <span class="info-value">${s?.gradeLevel ? `Grade ${s.gradeLevel}` : '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Strand:</span>
        <span class="info-value">${s?.strand?.name ?? '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Section:</span>
        <span class="info-value">${s?.section?.name ?? '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Company/Office:</span>
        <span class="info-value">${s?.company ?? '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Supervisor:</span>
        <span class="info-value">${s?.supervisor?.name ?? '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Activity Date:</span>
        <span class="info-value">${narrativeDateStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted On:</span>
        <span class="info-value">${submissionDateStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value">
          <span class="status-badge status-${
            narrative.status === 'approved' ? 'approved' :
            narrative.status === 'revision_requested' ? 'revision' : 'pending'
          }">
            ${narrative.status === 'approved' ? 'Approved' :
              narrative.status === 'revision_requested' ? 'Revision Requested' : 'Pending Review'}
          </span>
        </span>
      </div>
    </div>

    <!-- Narrative Content -->
    <div class="section">
      <h2 class="section-title">Narrative</h2>
      <div class="content-body">
        <p>${content}</p>
      </div>
    </div>

    ${verificationPhotoHtml}

    <!-- Footer -->
    <div class="footer">
      <p>Generated by PSBC Work Immersion Portal &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="margin-top:4px">This document is an official record of the student's Work Immersion activity.</p>
    </div>
  </div>
</body>
</html>`

    const filename = `Narrative_${s?.name?.replace(/\s+/g, '_') ?? 'Student'}_${narrativeDateStr.replace(/\s+/g, '_')}.html`

    return new NextResponse(html, {
      headers: {
        'Content-Type':        'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Download narrative error:', error)
    return new NextResponse('Failed to generate document', { status: 500 })
  }
}
