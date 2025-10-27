'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthContext'

export default function Nav() {
  const pathname = usePathname() || '/'
  const { isAuthenticated, user } = useAuth()

  const links = [
    { href: '/#collection', label: 'Products' },
    { href: '/sell', label: 'Sell' },
    { href: '/about', label: 'About' },
  ]

  // Add Account link if authenticated, Login if not
  if (isAuthenticated) {
    links.push({ href: '/account', label: 'Account' })
  } else {
    links.push({ href: '/login', label: 'Login' })
  }

  const isActive = (href) => {
    // Treat '/#all-products' as active when on the homepage
    if (href.startsWith('/#')) return pathname === '/'
    return pathname === href
  }

  return (
    <nav className="nav">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={isActive(l.href) ? 'active' : ''}>
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
