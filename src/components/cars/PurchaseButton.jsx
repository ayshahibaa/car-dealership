import { useState } from 'react';
import { Link } from 'react-router';
import Button from '../common/Button.jsx';
import { IconCheck } from '../icons/index.jsx';
import { buttonClasses } from '../../utils/buttonStyles.js';
import { requestPurchase } from '../../services/carService.js';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * The one "Buy" control used on both CarCard and CarDetailsPage — kept as
 * its own component so the purchase-request flow (auth check, the real API
 * call, success/error state) exists in exactly one place.
 *
 * Buying doesn't complete a sale on the spot any more: it files a request
 * (POST /api/purchase-requests) that an admin has to approve — see "My
 * orders" (OrdersPage.jsx) for where a buyer tracks that, and
 * AdminDashboardPage for where an admin decides it. This is the one part
 * of the demo that talks to the real backend rather than the local dataset
 * (see carService.js's file comment). If the backend isn't running, the
 * error from apiClient.js surfaces here rather than breaking the page.
 */
export default function PurchaseButton({ car, size = 'md', className = '', onRequested }) {
  const { isAuthenticated, token } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | loading | requested | error
  const [error, setError] = useState(null);

  const alreadySold = (car.quantity ?? 1) <= 0 || car.listingStatus === 'sold';

  // Distinct from "Sold out" below: this car wasn't out of stock when the
  // page loaded, *you* just sent a request for it this click — without
  // this, a successful request and an already-sold car looked identical.
  if (status === 'requested') {
    return (
      <Button size={size} variant="secondary" disabled fullWidth className={className}>
        <IconCheck className="h-4 w-4" /> Request sent
      </Button>
    );
  }

  if (alreadySold) {
    return (
      <Button size={size} variant="secondary" disabled fullWidth className={className}>
        Sold out
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link to="/login" className={buttonClasses({ variant: 'primary', size, fullWidth: true, className })}>
        Log in to buy
      </Link>
    );
  }

  async function handleRequest() {
    setStatus('loading');
    setError(null);
    try {
      const request = await requestPurchase(car.id, token);
      setStatus('requested');
      onRequested?.(request);
    } catch (err) {
      setStatus('idle');
      setError(err);
    }
  }

  return (
    <div className={className}>
      <Button size={size} fullWidth loading={status === 'loading'} onClick={handleRequest}>
        Request to buy
      </Button>
      {error && <p className="mt-1.5 text-xs text-brand-400">{error.message}</p>}
    </div>
  );
}
