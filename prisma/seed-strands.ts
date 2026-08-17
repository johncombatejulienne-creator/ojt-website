import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding strands and sections...')

  // Create Strands
  const ict = await prisma.strand.upsert({
    where: { name: 'ICT' },
    update: {},
    create: {
      name: 'ICT',
      description: 'Information and Communications Technology',
    },
  })

  const stem = await prisma.strand.upsert({
    where: { name: 'STEM' },
    update: {},
    create: {
      name: 'STEM',
      description: 'Science, Technology, Engineering, and Mathematics',
    },
  })

  const abm = await prisma.strand.upsert({
    where: { name: 'ABM' },
    update: {},
    create: {
      name: 'ABM',
      description: 'Accountancy, Business, and Management',
    },
  })

  const humss = await prisma.strand.upsert({
    where: { name: 'HUMSS' },
    update: {},
    create: {
      name: 'HUMSS',
      description: 'Humanities and Social Sciences',
    },
  })

  console.log('Created strands:', { ict, stem, abm, humss })

  // Create Sections for each strand
  const sections = [
    // ICT Sections
    { name: '12-A', gradeLevel: 12, strandId: ict.id },
    { name: '12-B', gradeLevel: 12, strandId: ict.id },
    
    // STEM Sections
    { name: '12-A', gradeLevel: 12, strandId: stem.id },
    { name: '12-B', gradeLevel: 12, strandId: stem.id },
    
    // ABM Sections
    { name: '12-A', gradeLevel: 12, strandId: abm.id },
    { name: '12-B', gradeLevel: 12, strandId: abm.id },
    
    // HUMSS Sections
    { name: '12-A', gradeLevel: 12, strandId: humss.id },
    { name: '12-B', gradeLevel: 12, strandId: humss.id },
  ]

  for (const section of sections) {
    await prisma.section.upsert({
      where: {
        strandId_name: {
          strandId: section.strandId,
          name: section.name,
        },
      },
      update: {},
      create: section,
    })
  }

  console.log('Created sections!')
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
