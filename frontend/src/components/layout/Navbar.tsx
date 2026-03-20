import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const navLinkClass = (path: string) =>
    location.pathname === path
      ? 'text-primary border-b-2 border-primary-container pb-1 transition-colors duration-300'
      : 'text-white/60 hover:text-primary transition-colors duration-300';

  return (
    <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center px-8 h-20">
        {/* Brand */}
        <Link to="/" className="text-2xl font-headline italic text-primary tracking-wide">
          Propellex
        </Link>

        {/* Desktop nav links */}
        {user && (
          <nav className="hidden md:flex items-center gap-10 font-headline font-light tracking-wide">
            {user.role === 'manager' ? (
              <>
                <Link to="/manager" className={navLinkClass('/manager')}>
                  User Management
                </Link>
                <Link to="/agency" className={navLinkClass('/agency')}>
                  Listings
                </Link>
              </>
            ) : user.role === 'admin' ? (
              <Link to="/agency" className={navLinkClass('/agency')}>
                Manage Listings
              </Link>
            ) : (
              <>
                <Link to="/" className={navLinkClass('/')}>
                  Portfolio
                </Link>
                <Link to="/search" className={navLinkClass('/search')}>
                  Discover
                </Link>
                <Link to="/shortlist" className={navLinkClass('/shortlist')}>
                  Intelligence
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              {/* Premium badge for non-free tiers */}
              {user.subscription_tier !== 'free' && (
                <span
                  className="material-symbols-outlined text-white/60 cursor-pointer hover:text-primary transition-colors duration-300"
                  title={user.subscription_tier}
                >
                  workspace_premium
                </span>
              )}

              {/* Role chip */}
              {user.role !== 'client' && (
                <span className="hidden sm:block bg-primary/10 text-primary text-xs px-3 py-1 font-label font-semibold uppercase tracking-widest border border-primary/20">
                  {user.role}
                </span>
              )}

              {/* Avatar — links to profile */}
              <Link
                to="/profile"
                className="w-9 h-9 bg-primary flex items-center justify-center text-on-primary text-sm font-label font-bold hover:bg-primary-container transition-colors duration-300"
                title={user.name}
              >
                {user.name?.[0]?.toUpperCase() ?? 'U'}
              </Link>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="hidden sm:block text-white/60 hover:text-primary text-sm font-label transition-colors duration-300"
              >
                Sign out
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden text-white/60 hover:text-primary transition-colors duration-300"
                aria-label="Toggle menu"
              >
                <span className="material-symbols-outlined">
                  {mobileOpen ? 'close' : 'menu'}
                </span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-primary text-on-primary px-5 py-2 text-sm font-label font-semibold uppercase tracking-widest hover:bg-primary-container transition-colors duration-300"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && user && (
        <div className="md:hidden bg-surface-container-low border-t border-outline-variant px-8 py-4 flex flex-col gap-4 font-headline font-light tracking-wide">
          {user.role === 'manager' ? (
            <>
              <Link
                to="/manager"
                onClick={() => setMobileOpen(false)}
                className={navLinkClass('/manager')}
              >
                User Management
              </Link>
              <Link
                to="/agency"
                onClick={() => setMobileOpen(false)}
                className={navLinkClass('/agency')}
              >
                Listings
              </Link>
            </>
          ) : user.role === 'admin' ? (
            <Link
              to="/agency"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass('/agency')}
            >
              Manage Listings
            </Link>
          ) : (
            <>
              <Link to="/" onClick={() => setMobileOpen(false)} className={navLinkClass('/')}>
                Portfolio
              </Link>
              <Link
                to="/search"
                onClick={() => setMobileOpen(false)}
                className={navLinkClass('/search')}
              >
                Discover
              </Link>
              <Link
                to="/shortlist"
                onClick={() => setMobileOpen(false)}
                className={navLinkClass('/shortlist')}
              >
                Intelligence
              </Link>
            </>
          )}
          <button
            onClick={handleLogout}
            className="text-left text-white/60 hover:text-primary text-sm font-label transition-colors duration-300"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
