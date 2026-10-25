import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { ErrorMessage } from '../components/common/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer className="py-12">
      <div className="mx-auto max-w-sm">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="mt-2 text-sm text-ink-400">
          You’ll need an account to buy a car or list your own.
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
            autoComplete="new-password"
            required
            minLength={8}
            hint="At least 8 characters."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <ErrorMessage error={error} title="Could not create your account" />}

          <Button type="submit" fullWidth loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-400">
          Already have an account?{' '}
          <Link className="text-brand-400 underline" to="/login" state={location.state}>
            Log in
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
