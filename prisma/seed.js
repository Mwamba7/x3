const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const username = 'okeromwamba'
  const password = 'okeromwamba'
  const existing = await prisma.user.findUnique({ where: { username } })
  if (!existing) {
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)
    await prisma.user.create({ data: { username, passwordHash } })
    console.log('Seed: created admin user:', username)
  } else {
    console.log('Seed: admin user already exists')
  }

  // Seed default categories
  const defaultCategories = [
    { key: 'tv', label: 'Televisions' },
    { key: 'radio', label: 'Radios' },
    { key: 'phone', label: 'Mobile Phones' },
    { key: 'fridge', label: 'Fridges' },
    { key: 'cooler', label: 'Gas Coolers' },
    { key: 'accessory', label: 'Accessories' },
    { key: 'hoodie', label: 'Hoodies' },
    { key: 'shoes', label: 'Shoes' },
    { key: 'sneakers', label: 'Sneakers' },
  ]
  for (const c of defaultCategories) {
    await prisma.category.upsert({
      where: { key: c.key },
      update: { label: c.label },
      create: c,
    })
  }
  console.log('Seed: categories ensured')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
