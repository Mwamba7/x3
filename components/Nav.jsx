'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname() || '/'

  const links = [
    { href: '/#collection', label: 'Products' },
    { href: '/sell', label: 'Sell' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

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
