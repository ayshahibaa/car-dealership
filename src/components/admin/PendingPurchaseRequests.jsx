import { useState } from 'react';
import Button from '../common/Button.jsx';
import { Loader, ErrorMessage, EmptyState } from '../common/StatusMessage.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { approvePurchaseRequest, getPendingPurchaseRequests, rejectPurchaseRequest } from '../../services/carService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

/**
 * Buyers' requests to purchase a car, awaiting a decision. Approving is
 * what actually completes the sale — decrements the vehicle's stock (see
 * backend's purchaseRequestService.ts) — rejecting leaves it untouched.
 * This is the admin side of PurchaseButton.jsx's "Request to buy".
 */
export default function PendingPurchaseRequests({ token }) {
  const [version, setVersion] = useState(0);
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { data: requests, loading, error } = useAsync(() => getPendingPurchaseRequests(token), [token, version]);

  async function handleDecision(id, decide) {
    setActioningId(id);
    setActionError(null);
    try {
      await decide(id, token);
      setVersion((v) => v + 1);
    } catch (err) {
      setActionError(err);
    } finally {
      setActioningId(null);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-bold">Pending purchase requests</h2>
      <p className="mt-1 text-sm text-ink-400">Approving completes the sale and decrements stock; rejecting leaves the car untouched.</p>

      {loading && <Loader label="Loading pending requests…" />}
      {error && <div className="mt-4"><ErrorMessage error={error} title="Could not load pending requests" /></div>}
      {actionError && <div className="mt-4"><ErrorMessage error={actionError} /></div>}

      {!loading && !error && requests?.length === 0 && (
        <div className="mt-4"><EmptyState title="No requests waiting on review" /></div>
      )}

      {!loading && !error && requests?.length > 0 && (
        <ul className="mt-4 space-y-2">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-ink-850 p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-white">{r.vehicle?.title ?? 'Vehicle no longer available'}</p>
                <p className="text-sm text-ink-400">
                  {r.vehicle && <>{formatCurrency(r.vehicle.price)} · </>}
                  requested by {r.buyerEmail ?? r.buyerId} on {new Date(r.requestedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={actioningId === r.id}
                  onClick={() => handleDecision(r.id, approvePurchaseRequest)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={actioningId === r.id}
                  onClick={() => handleDecision(r.id, rejectPurchaseRequest)}
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
