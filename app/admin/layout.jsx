export default function AdminLayout({ children }) {
  return (
    <>
      {/* Add bottom padding so the fixed footer does not overlap page content */}
      <div className="admin-root" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
        {children}
      </div>
      {/* Fixed footer aligned with the page container */}
      <div style={{ position: 'fixed', insetInlineStart: 0, insetBlockEnd: 0, width: '100%', zIndex: 40, background: 'transparent', pointerEvents: 'none' }}>
        <div className="container" style={{ padding: 8, display: 'flex', alignItems: 'center' }}>
          <form action="/api/auth/logout" method="post" style={{ pointerEvents: 'auto' }}>
            <button
              className="btn"
              type="submit"
              title="Logout"
              aria-label="Logout from admin"
              style={{ fontSize: 13, padding: '6px 10px' }}
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
