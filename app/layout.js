import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Think Twice Resellers — Quality Pre‑Owned Electronics & Appliances',
  description: 'Resale of quality used electronics and appliances: TVs, radios, phones, gas coolers, fridges and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="site-header">
          <div className="container header-inner">
            <div className="brand">
              <span className="logo" aria-hidden="true">♻️</span>
              <h1 className="brand-title"><Link href="/">Think Twice Resellers</Link></h1>
            </div>
            <nav className="nav">
              <Link href="/#all-products">Products</Link>
              <Link href="/sell">Sell</Link>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <p style={{ margin: 0, paddingTop: 6, width: '100%', textAlign: 'center' }}>© <span id="year">{new Date().getFullYear()}</span> Think Twice Resellers. All rights reserved.</p>
            <div className="footer-links">
              
            </div>
            <a
              href="https://okerotechnologies.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                margin: 0,
                marginLeft: 'auto',
                textAlign: 'right',
                fontStyle: 'italic',
                color: '#3b82f6',
                textDecoration: 'none',
                display: 'block',
                paddingBottom: 6,
              }}
            >
              Powered by Okero Technologies
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
