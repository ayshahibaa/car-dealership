import { useState } from 'react';
import { Link } from 'react-router';
import Button from '../common/Button.jsx';
import { IconCheck } from '../icons/index.jsx';
import { buttonClasses } from '../../utils/buttonStyles.js';
import { requestPurchase } from '../../services/carService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function PurchaseButton({ car, size = 'md', className = '', onRequested }) {
  const { isAuthenticated, token } = useAuth();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const alreadySold = (car.quantity ?? 1) <= 0 || car.listingStatus === 'sold';

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
