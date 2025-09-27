import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Nav from '../components/Nav'
import { CartProvider } from '../components/CartContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Super Twice Resellers — Quality Pre‑Owned Electronics & Appliances',
  description: 'Resale of quality used electronics and appliances: TVs, radios, phones, gas coolers, fridges and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <header className="site-header">
            <div className="container header-inner">
              <div className="brand">
                <span className="logo" aria-hidden="true">♻️</span>
                <h1 className="brand-title"><Link href="/">Super Twice Resellers</Link></h1>
              </div>
              <Nav />
            </div>
          </header>
          <main className="page-content">
            {children}
          </main>
          <footer className="site-footer">
            <div className="container footer-inner">
              <p style={{ margin: 0, paddingTop: 6, width: '100%', textAlign: 'center' }}>© <span id="year">{new Date().getFullYear()}</span> Super Twice Resellers. All rights reserved.</p>
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
                  marginBottom: '12px',
                }}
              >
                Powered by Okero Technologies
              </a>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}

