import React, { useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/orders', label: 'Orders', icon: '📋' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/customers', label: 'Customers', icon: '👥' },
] as const;

const styles: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  sidebar: {
    width: 220,
    background: '#111827',
    color: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  logo: {
    padding: '20px 16px 16px',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    borderBottom: '1px solid #1f2937',
    color: '#f9fafb',
  },
  nav: { flex: 1, padding: '12px 0' },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 16px',
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', background: '#f9fafb' },
  topbar: {
    height: 56,
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 24px',
    gap: 12,
  },
  cartBadge: {
    background: '#2563eb',
    color: '#fff',
    borderRadius: 99,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 600,
  },
  content: { flex: 1, padding: 24, overflowY: 'auto' as const },
};

export function AppShell() {
  const navigate = useNavigate();
  const cartCount = useCartStore(useCallback((s) => s.items.length, []));

  const goToCart = useCallback(() => navigate('/cart'), [navigate]);

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Propellex</div>
        <nav style={styles.nav}>
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive
                  ? { color: '#f9fafb', background: '#1f2937' }
                  : {}),
              })}
            >
              <span aria-hidden>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div style={styles.main}>
        <header style={styles.topbar}>
          <button
            type="button"
            onClick={goToCart}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            aria-label={`Cart — ${cartCount} items`}
          >
            🛒
            {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
          </button>
        </header>
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
