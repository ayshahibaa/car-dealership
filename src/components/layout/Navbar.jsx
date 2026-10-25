import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import Logo from '../brand/Logo.jsx';
import Button from '../common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/cars', label: 'Buy' },
  { to: '/sell', label: 'Sell' },
  { to: '/favorites', label: 'Favourites' },
];

const linkClass = ({ isActive }) =>
  [
    'relative px-1 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-white' : 'text-ink-300 hover:text-white',
    // red underline on the active link, like the reference design
    isActive ? 'after:absolute after:inset-x-0 after:-bottom-[17px] after:h-0.5 after:bg-brand-500' : '',
  ].join(' ');

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { count: cartCount } = useCart();

  // Close the mobile menu whenever the page changes
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const links = [
    ...NAV_LINKS,
    { to: '/cart', label: cartCount > 0 ? `Cart (${cartCount})` : 'Cart' },
    ...(isAuthenticated ? [{ to: '/orders', label: 'My orders' }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link to="/" className="shrink-0" aria-label="Autoza home">
          <Logo className="h-6 w-auto sm:h-7" />
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop account controls */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-ink-400" title={user.email}>{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-300 hover:text-white">Log in</Link>
              <Button size="sm" onClick={() => navigate('/register')}>Register</Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-ink-200 hover:bg-white/10 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div id="mobile-menu" className="border-t border-white/10 bg-ink-950 md:hidden">
          <ul className="space-y-1 px-4 py-3">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-base font-medium ${isActive ? 'bg-white/10 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white'}`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/10 px-4 py-3">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <span className="truncate text-sm text-ink-400">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>Log out</Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-ink-300 hover:bg-white/5 hover:text-white">
                  Log in
                </Link>
                <Button size="sm" className="flex-1" onClick={() => navigate('/register')}>Register</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
