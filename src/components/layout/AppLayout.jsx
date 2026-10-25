import { Outlet, ScrollRestoration } from 'react-router';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import CompareBar from '../compare/CompareBar.jsx';
import { useCompare } from '../../context/CompareContext.jsx';

/** Wraps every page: header on top, footer at the bottom, page content in between. */
export default function AppLayout() {
  const { count } = useCompare();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-ink-900"
      >
        Skip to content
      </a>
      <Navbar />
      {/* Extra bottom space so the floating compare bar never covers page content/footer links. */}
      <main id="main" className={`flex-1 ${count > 0 ? 'pb-20' : ''}`}>
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
      <ScrollRestoration />
    </div>
  );
}
