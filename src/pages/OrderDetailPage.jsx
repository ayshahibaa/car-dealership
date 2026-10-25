import { Link, useParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import Badge from '../components/common/Badge.jsx';
import { Loader, ErrorMessage, EmptyState } from '../components/common/StatusMessage.jsx';
import { IconCheck } from '../components/icons/index.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyPurchaseRequests } from '../services/carService.js';
import { formatCurrency } from '../utils/formatCurrency.js';

const STATUS_BADGE = {
  PENDING: { tone: 'warning', label: 'Pending review' },
  APPROVED: { tone: 'success', label: 'Approved' },
  REJECTED: { tone: 'danger', label: 'Rejected' },
};

const STATUS_MESSAGE = {
  PENDING: 'Your request is in the queue. The Autoza team will review it and contact you soon.',
  APPROVED: 'The Autoza team will contact you soon to arrange payment and pickup or delivery.',
  REJECTED: "This request wasn't approved. You're welcome to browse similar cars or send another request.",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data: requests, loading, error } = useAsync(() => getMyPurchaseRequests(token), [token]);
  const request = requests?.find((r) => r.id === id);

  return (
    <PageContainer className="py-12">
      <Link to="/orders" className="text-sm text-ink-400 hover:text-white">← Back to my orders</Link>

      {loading && <Loader label="Loading your order…" />}
      {error && <div className="mt-6"><ErrorMessage error={error} title="Could not load this order" /></div>}

      {!loading && !error && !request && (
        <div className="mt-6">
          <EmptyState title="Order not found">
            This isn't one of your requests. <Link className="text-brand-400 underline" to="/orders">Back to my orders</Link>.
          </EmptyState>
        </div>
      )}

      {request && (
        <div className="mx-auto mt-8 max-w-xl rounded-card bg-ink-850 p-6 shadow-card ring-1 ring-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                {request.status === 'APPROVED' ? 'Purchase confirmed' : 'Purchase request'}
              </h1>
              <p className="mt-1 text-sm text-ink-400">Request #{request.id.slice(0, 8)}</p>
            </div>
            {request.status === 'APPROVED' ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-500/15 text-green-700">
                <IconCheck className="h-5 w-5" />
              </span>
            ) : (
              <Badge tone={STATUS_BADGE[request.status]?.tone ?? 'neutral'}>{STATUS_BADGE[request.status]?.label ?? request.status}</Badge>
            )}
          </div>

          {request.vehicle ? (
            <div className="mt-6 rounded-lg border border-white/10 p-4">
              <Link to={`/cars/${request.vehicle.id}`} className="font-display font-semibold text-white hover:text-brand-300">
                {request.vehicle.title}
              </Link>
              <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-sm">
                <dt className="text-ink-400">Price</dt>
                <dd className="text-right font-semibold text-white">{formatCurrency(request.vehicle.price)}</dd>
                <dt className="text-ink-400">Stock #</dt>
                <dd className="text-right text-ink-300">{request.vehicle.stockNumber}</dd>
                <dt className="text-ink-400">Requested</dt>
                <dd className="text-right text-ink-300">{new Date(request.requestedAt).toLocaleString()}</dd>
                {request.decidedAt && (
                  <>
                    <dt className="text-ink-400">Decided</dt>
                    <dd className="text-right text-ink-300">{new Date(request.decidedAt).toLocaleString()}</dd>
                  </>
                )}
              </dl>
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink-400">This vehicle is no longer in the database.</p>
          )}

          <p className="mt-6 text-sm text-ink-300">{STATUS_MESSAGE[request.status] ?? ''}</p>
        </div>
      )}
    </PageContainer>
  );
}
