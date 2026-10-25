import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';

/**
 * Shown for unknown URLs (404) and, as the router's error element,
 * for unexpected errors while rendering a page.
 */
export default function NotFoundPage() {
  const error = useRouteError();
  const isUnexpected = error && !(isRouteErrorResponse(error) && error.status === 404);

  return (
    <PageContainer className="py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-500">{isUnexpected ? 'Oops' : '404'}</p>
      <h1 className="mt-4 text-2xl font-bold">{isUnexpected ? 'Something went wrong' : 'Page not found'}</h1>
      <p className="mt-2 text-ink-400">
        {isUnexpected ? 'Please try again, or head back to the homepage.' : 'The page you’re looking for doesn’t exist.'}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/" className="rounded-md bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">Go home</Link>
        <Link to="/cars" className="rounded-md border border-white/20 px-5 py-2.5 font-semibold text-white hover:bg-white/10">Browse cars</Link>
      </div>
    </PageContainer>
  );
}
