import { Link } from 'react-router';
import Logo from '../brand/Logo.jsx';
import { appConfig } from '../../config/appConfig.js';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Logo tone="dark" className="h-6 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-ink-400">{appConfig.brand.tagline}.</p>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="text-ink-400 hover:text-white" to="/cars">Browse cars</Link></li>
            <li><Link className="text-ink-400 hover:text-white" to="/sell">Sell your car</Link></li>
            <li><Link className="text-ink-400 hover:text-white" to="/favorites">Favourites</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">About this demo</h2>
          <p className="mt-4 text-sm text-ink-400">
            Autoza is a portfolio project. Listings come from a sample dataset, vehicle images are illustrations, and
            forms are saved only in your browser.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} {appConfig.brand.name} · Demo project ·{' '}
        <Link className="hover:text-ink-300" to="/admin/login">Admin login</Link>
      </div>
    </footer>
  );
}
