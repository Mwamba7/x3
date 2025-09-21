import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const alg = 'HS256'
const sessionCookie = 'tt_session'

export const authConfig = {
  sessionCookie,
  cookieMaxAgeDays: 7,
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function createSession(payload) {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev_secret')
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(`${authConfig.cookieMaxAgeDays}d`)
    .sign(secret)
  return jwt
}

export async function verifySession(token) {
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev_secret')
    const { payload } = await jwtVerify(token, secret, { algorithms: [alg] })
    return payload
  } catch {
    return null
  }
}
