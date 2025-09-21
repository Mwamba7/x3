import { PrismaClient } from '@prisma/client'

let prisma

// One-time diagnostics logger (non-noisy): set PRISMA_DIAG=1 to enable
function logPrismaDiagnosticsOnce(client) {
  try {
    if (global.__PRISMA_DIAG_DONE__ || !process.env.PRISMA_DIAG) return
    global.__PRISMA_DIAG_DONE__ = true
    const url = process.env.DATABASE_URL || ''
    const scheme = url.split(':')[0] || 'unknown'
    // Avoid printing full URL; only print scheme and basic env info
    console.info('[prisma] init', {
      node: process.version,
      env: process.env.NODE_ENV,
      netlify: Boolean(process.env.NETLIFY),
      prismaClientVersion: client?._engineConfig?.clientVersion || 'unknown',
      db: { scheme },
      binaryTargets: process.env.PRISMA_CLI_BINARY_TARGETS || 'default'
    })
  } catch (_) {
    // best-effort diagnostics
  }
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ log: ['error', 'warn'] })
  logPrismaDiagnosticsOnce(prisma)
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({ log: ['error', 'warn'] })
    logPrismaDiagnosticsOnce(global.prisma)
  }
  prisma = global.prisma
}

export default prisma
