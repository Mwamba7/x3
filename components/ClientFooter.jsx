'use client'

import { usePathname } from 'next/navigation'
import CurrentYear from './CurrentYear'

export default function ClientFooter() {
  const pathname = usePathname()
  
  // Only show copyright and "Powered by" on the about page
  const isAboutPage = pathname === '/about'
  
  if (!isAboutPage) {
    return null
  }
  
  return (
    <>
      <p style={{ margin: 0, paddingTop: 6, textAlign: 'center' }}>© <CurrentYear /> Super Twice Resellers. All rights reserved.</p>
      <a
        href="https://okerotechnologies.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          margin: 0,
          textAlign: 'center',
          fontStyle: 'italic',
          color: '#3b82f6',
          textDecoration: 'none',
          display: 'block',
          marginBottom: '12px',
        }}
      >
        Powered by Okero Technologies
      </a>
    </>
  )
}
