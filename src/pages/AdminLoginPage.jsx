import { useState } from 'react';
import { useNavigate } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { ErrorMessage } from '../components/common/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { user } = await login(email, password);
      if (user.role !== 'ADMIN') {
        logout();
        setError({ message: 'This account does not have admin access.' });
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer className="py-12">
      <div className="mx-auto max-w-sm">
        <h1 className="text-3xl font-bold">Admin log in</h1>
        <p className="mt-2 text-sm text-ink-400">
          Review pending listings, approve purchase requests, and manage inventory.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <ErrorMessage error={error} title="Could not log in" />}

          <Button type="submit" fullWidth loading={submitting}>
            Log in as admin
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}
