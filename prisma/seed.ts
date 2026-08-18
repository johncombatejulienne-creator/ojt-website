import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create sample teachers
  const hashedPassword = await bcrypt.hash('password123', 10)

  const teacher1 = await prisma.teacher.upsert({
    where: { email: 'teacher1@school.edu' },
    update: {},
    create: {
      teacherId: 'TCH001',
      name: 'Ms. Sarah Johnson',
      email: 'teacher1@school.edu',
      password: hashedPassword,
      role: 'teacher',
    },
  })

  const teacher2 = await prisma.teacher.upsert({
    where: { email: 'teacher2@school.edu' },
    update: {},
    create: {
      teacherId: 'TCH002',
      name: 'Mr. John Smith',
      email: 'teacher2@school.edu',
      password: hashedPassword,
      role: 'teacher',
    },
  })

  console.log('Created teachers:', { teacher1, teacher2 })

  // Create sample students
  const student1 = await prisma.student.upsert({
    where: { email: 'student1@gmail.com' },
    update: {},
    create: {
      studentId: 'STU2024001',
      name: 'Juan Dela Cruz',
      email: 'student1@gmail.com',
      company: 'Tech Solutions Inc.',
      course: 'Computer Science',
      supervisorId: teacher1.id,
    },
  })

  const student2 = await prisma.student.upsert({
    where: { email: 'student2@gmail.com' },
    update: {},
    create: {
      studentId: 'STU2024002',
      name: 'Maria Santos',
      email: 'student2@gmail.com',
      company: 'Business Corp Ltd.',
      course: 'Business Administration',
      supervisorId: teacher1.id,
    },
  })

  const student3 = await prisma.student.upsert({
    where: { email: 'student3@gmail.com' },
    update: {},
    create: {
      studentId: 'STU2024003',
      name: 'Pedro Gonzales',
      email: 'student3@gmail.com',
      company: 'Engineering Works',
      course: 'Engineering',
      supervisorId: teacher2.id,
    },
  })

  console.log('Created students:', { student1, student2, student3 })

  // Create sample narratives
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const narrative1 = await prisma.narrative.create({
    data: {
      studentId: student1.id,
      date: today,
      timeIn: '08:00',
      timeOut: '17:00',
      hoursRendered: 8,
      content: `
        <h2>Daily Activities</h2>
        <p>Today was a productive day at Tech Solutions Inc. I started by attending the morning standup meeting where we discussed the project progress and assigned tasks for the day.</p>
        <h3>Morning Tasks (8:00 AM - 12:00 PM)</h3>
        <ul>
          <li>Reviewed pull requests from team members</li>
          <li>Fixed bugs in the authentication module</li>
          <li>Updated documentation for the API endpoints</li>
        </ul>
        <h3>Afternoon Tasks (1:00 PM - 5:00 PM)</h3>
        <ul>
          <li>Implemented new feature for user profile management</li>
          <li>Conducted code review with senior developer</li>
          <li>Participated in planning meeting for next sprint</li>
        </ul>
        <h3>Learnings</h3>
        <p>I learned about proper error handling in React applications and best practices for state management using Redux. My supervisor provided valuable feedback on code organization.</p>
      `,
      status: 'approved',
      verificationStatus: 'on_time',
      submissionDate: today,
      submissionTime: new Date().toLocaleTimeString(),
      timezone: 'Asia/Manila',
      deviceUsed: 'Mobile',
      isDraft: false,
    },
  })

  const narrative2 = await prisma.narrative.create({
    data: {
      studentId: student2.id,
      date: yesterday,
      timeIn: '09:00',
      timeOut: '18:00',
      hoursRendered: 8,
      content: `
        <h2>Business Operations</h2>
        <p>I was assigned to the marketing department today and learned about their campaign strategies.</p>
        <h3>Morning Session</h3>
        <p>Attended a client presentation and took notes on the proposal details. The team demonstrated excellent presentation skills.</p>
        <h3>Afternoon Session</h3>
        <p>Assisted in creating social media content and analyzed engagement metrics from previous campaigns. Very insightful experience!</p>
      `,
      status: 'pending',
      verificationStatus: 'on_time',
      submissionDate: yesterday,
      submissionTime: yesterday.toLocaleTimeString(),
      timezone: 'Asia/Manila',
      deviceUsed: 'Desktop',
      isDraft: false,
    },
  })

  console.log('Created narratives:', { narrative1, narrative2 })

  // Create sample holidays
  const holidays = [
    {
      date: new Date('2026-12-25'),
      name: 'Christmas Day',
      description: 'Christmas Holiday',
    },
    {
      date: new Date('2026-12-30'),
      name: 'Rizal Day',
      description: 'National Holiday',
    },
    {
      date: new Date('2027-01-01'),
      name: "New Year's Day",
      description: 'New Year Holiday',
    },
  ]

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { date: holiday.date },
      update: {},
      create: holiday,
    })
  }

  console.log('Created holidays')

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: teacher1.id,
        userType: 'teacher',
        action: 'login',
        description: 'Teacher logged in to the system',
      },
      {
        userId: student1.id,
        userType: 'student',
        action: 'narrative_submitted',
        description: 'Student submitted daily narrative',
        metadata: JSON.stringify({ narrativeId: narrative1.id }),
      },
    ],
  })

  console.log('Created audit logs')
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
