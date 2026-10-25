import { useState } from 'react';
import { Link } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import { Loader, ErrorMessage, EmptyState } from '../components/common/StatusMessage.jsx';
import PendingListings from '../components/admin/PendingListings.jsx';
import PendingPurchaseRequests from '../components/admin/PendingPurchaseRequests.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { deleteVehicle, getAllVehiclesForAdmin, restockVehicle } from '../services/carService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [version, setVersion] = useState(0);
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { data: vehicles, loading, error } = useAsync(() => getAllVehiclesForAdmin(token), [token, version]);

  async function handleRestock(id) {
    setActioningId(id);
    setActionError(null);
    try {
      await restockVehicle(id, token);
      setVersion((v) => v + 1);
    } catch (err) {
      setActionError(err);
    } finally {
      setActioningId(null);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setActioningId(id);
    setActionError(null);
    try {
      await deleteVehicle(id, token);
      setVersion((v) => v + 1);
    } catch (err) {
      setActionError(err);
    } finally {
      setActioningId(null);
    }
  }

  return (
    <PageContainer className="py-12">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>

      <div className="mt-8"><PendingListings token={token} /></div>
      <div className="mt-10"><PendingPurchaseRequests token={token} /></div>

      <h2 className="mt-10 text-xl font-bold">All inventory</h2>
      <p className="mt-1 text-sm text-ink-400">
        Restock a sold car or remove a listing. Showing every vehicle in the database, not just those
        for sale — see <Link className="underline" to="/sell">Sell your car</Link> for how new listings get here.
      </p>

      {loading && <Loader label="Loading inventory…" />}
      {error && <div className="mt-6"><ErrorMessage error={error} title="Could not load inventory" /></div>}
      {actionError && <div className="mt-6"><ErrorMessage error={actionError} /></div>}

      {!loading && !error && vehicles?.length === 0 && (
        <div className="mt-6"><EmptyState title="No vehicles in the database yet" /></div>
      )}

      {!loading && !error && vehicles?.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-ink-850 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3">Stock #</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-400">{v.stockNumber}</td>
                  <td className="px-4 py-3 font-medium text-white">{v.title}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatCurrency(v.price)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{v.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge tone={v.quantity > 0 ? 'success' : 'neutral'}>{v.listingStatus}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge
                      tone={v.approvalStatus === 'approved' ? 'success' : v.approvalStatus === 'rejected' ? 'danger' : 'warning'}
                    >
                      {v.approvalStatus ?? 'approved'}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {v.quantity <= 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={actioningId === v.id}
                          onClick={() => handleRestock(v.id)}
                        >
                          Restock
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        loading={actioningId === v.id}
                        onClick={() => handleDelete(v.id, v.title)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
