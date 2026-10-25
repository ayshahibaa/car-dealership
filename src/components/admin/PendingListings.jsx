import { useState } from 'react';
import Button from '../common/Button.jsx';
import { Loader, ErrorMessage, EmptyState } from '../common/StatusMessage.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { approveVehicleListing, getPendingVehicles, rejectVehicleListing } from '../../services/carService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

/**
 * Cars submitted through "Sell your car", awaiting moderation. Approving is
 * what makes a listing start showing up on the site (see
 * carService.js's getCommunityListings) — nothing here is public until an
 * admin acts on it.
 */
export default function PendingListings({ token }) {
  const [version, setVersion] = useState(0);
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { data: vehicles, loading, error } = useAsync(() => getPendingVehicles(token), [token, version]);

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
      <h2 className="text-xl font-bold">Pending listings</h2>
      <p className="mt-1 text-sm text-ink-400">Cars submitted by sellers — approve to list them, or reject to keep them out.</p>

      {loading && <Loader label="Loading pending listings…" />}
      {error && <div className="mt-4"><ErrorMessage error={error} title="Could not load pending listings" /></div>}
      {actionError && <div className="mt-4"><ErrorMessage error={actionError} /></div>}

      {!loading && !error && vehicles?.length === 0 && (
        <div className="mt-4"><EmptyState title="Nothing waiting on review" /></div>
      )}

      {!loading && !error && vehicles?.length > 0 && (
        <ul className="mt-4 space-y-2">
          {vehicles.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-ink-850 p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-white">{v.title}</p>
                <p className="text-sm text-ink-400">{formatCurrency(v.price)} · stock #{v.stockNumber}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={actioningId === v.id}
                  onClick={() => handleDecision(v.id, approveVehicleListing)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={actioningId === v.id}
                  onClick={() => handleDecision(v.id, rejectVehicleListing)}
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
