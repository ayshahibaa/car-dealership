import { Link } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import Badge from '../components/common/Badge.jsx';
import { Loader, ErrorMessage, EmptyState } from '../components/common/StatusMessage.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyPurchaseRequests } from '../services/carService.js';
import { formatCurrency } from '../utils/formatCurrency.js';

const STATUS_BADGE = {
  PENDING: { tone: 'warning', label: 'Pending review' },
  APPROVED: { tone: 'success', label: 'Approved' },
  REJECTED: { tone: 'danger', label: 'Rejected' },
};

export default function OrdersPage() {
  const { token } = useAuth();
  const { data: requests, loading, error } = useAsync(() => getMyPurchaseRequests(token), [token]);

  return (
    <PageContainer className="py-12">
      <h1 className="text-3xl font-bold">My orders</h1>
      <p className="mt-2 text-sm text-ink-400">Every car you've requested to buy, and whether it's been approved yet.</p>

      {loading && <Loader label="Loading your orders…" />}
      {error && <div className="mt-6"><ErrorMessage error={error} title="Could not load your orders" /></div>}

      {!loading && !error && requests?.length === 0 && (
        <div className="mt-8">
          <EmptyState title="No requests yet">
            Browse the <Link className="text-brand-400 underline" to="/cars">inventory</Link> and request to buy a car.
          </EmptyState>
        </div>
      )}

      {!loading && !error && requests?.length > 0 && (
        <ul className="mt-8 space-y-3">
          {requests.map((request) => {
            const badge = STATUS_BADGE[request.status] ?? { tone: 'neutral', label: request.status };
            return (
              <li key={request.id}>
                <Link
                  to={`/orders/${request.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-ink-850 p-4 shadow-card ring-1 ring-white/5 hover:ring-white/15"
                >
                  <div className="min-w-0">
                    <span className="font-display text-sm font-semibold text-white">
                      {request.vehicle?.title ?? 'Vehicle no longer available'}
                    </span>
                    <p className="mt-0.5 text-xs text-ink-400">
                      Requested {new Date(request.requestedAt).toLocaleDateString()}
                      {request.vehicle && <> · {formatCurrency(request.vehicle.price)}</>}
                    </p>
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
