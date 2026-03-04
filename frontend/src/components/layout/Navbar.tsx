import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-gold font-semibold'
      : 'text-white/80 hover:text-white';

  return (
    <nav className="bg-navy shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-navy font-bold text-sm">P</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Propellex</span>
          </Link>

          {/* Nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/" className={isActive('/')}>
                Home
              </Link>
              <Link to="/search" className={isActive('/search')}>
                Search
              </Link>
              <Link to="/shortlist" className={isActive('/shortlist')}>
                Shortlist
              </Link>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-white/70 text-sm">
                  {user.name}
                </span>
                <Link
                  to="/profile"
                  className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-semibold"
                >
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-gold text-navy px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gold-light transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
