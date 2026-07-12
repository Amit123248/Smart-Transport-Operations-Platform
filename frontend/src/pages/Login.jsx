import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { login, signup } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ROLES } from '../permissions.js';
import { Button, Field, Input, Select, Spinner } from '../components/ui.jsx';

const ROLE_BLURB = {
  'Fleet Manager': 'Full control of vehicles, drivers, and maintenance.',
  Dispatcher: 'Creates and dispatches trips against available assets.',
  'Safety Officer': 'Owns driver compliance and license validity.',
  'Financial Analyst': 'Reviews cost, fuel spend, and profitability.',
};

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'raven.k@transitops.in', password: 'demo1234', role: 'Dispatcher' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(form.email, form.password);
        loginSuccess(res);
        showToast(`Welcome back, ${res.user.name.split(' ')[0]}.`, 'success');
        navigate('/');
      } else {
        await signup(form);
        const res = await login(form.email, form.password);
        loginSuccess(res);
        showToast('Account created — you\'re in.', 'success');
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Console side */}
      <div className="hidden lg:flex w-[42%] bg-console text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />
        <div className="relative flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="22" fill="#FF5A1F" />
            <path d="M20 62 L45 32 L58 48 L80 24" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display font-semibold">TransitOps</span>
        </div>

        <div className="relative">
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-4">Fleet Operations Console</p>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] mb-5">
            Every vehicle,<br />driver, and trip —<br />on one manifest.
          </h1>
          <p className="text-sm text-white/55 max-w-sm leading-relaxed">
            Dispatch validates capacity and license status before a trip ever leaves the yard,
            so nothing gets waved through that shouldn't be.
          </p>

          <div className="mt-10 flex items-center gap-6 font-mono text-xs text-white/40">
            <div>
              <p className="text-white text-lg font-display font-semibold">04</p>
              <p>Fleet roles</p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-white text-lg font-display font-semibold">100%</p>
              <p>Server-side rules</p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-white text-lg font-display font-semibold">Live</p>
              <p>Status transitions</p>
            </div>
          </div>
        </div>

        <p className="relative text-[11px] font-mono text-white/30">© 2026 TransitOps — internal operations tooling</p>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="22" fill="#FF5A1F" />
              <path d="M20 62 L45 32 L58 48 L80 24" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display font-semibold text-ink">TransitOps</span>
          </div>

          <div className="flex items-center gap-1 mb-7 bg-[#F0F0EE] rounded-md p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-[6px] py-2 text-xs font-semibold transition-colors ${mode === 'login' ? 'bg-white text-ink shadow-panel' : 'text-muted'}`}
            >
              <LogIn size={13} /> Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-[6px] py-2 text-xs font-semibold transition-colors ${mode === 'signup' ? 'bg-white text-ink shadow-panel' : 'text-muted'}`}
            >
              <UserPlus size={13} /> Create account
            </button>
          </div>

          <h2 className="font-display text-xl font-semibold text-ink mb-1">
            {mode === 'login' ? 'Log in to your console' : 'Register a new operator'}
          </h2>
          <p className="text-sm text-muted mb-6">
            {mode === 'login' ? 'Access is scoped to your assigned role.' : 'Choose the role that matches your day-to-day work.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Field label="Full name" required>
                <Input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Alex Rao" />
              </Field>
            )}
            <Field label="Email" required>
              <Input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@transitops.in" />
            </Field>
            <Field label="Password" required>
              <Input type="password" required value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" />
            </Field>
            <Field label="Role" required hint={ROLE_BLURB[form.role]}>
              <Select value={form.role} onChange={(e) => update('role', e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>

            {error && (
              <div className="rounded-md bg-[#FBEBEB] px-3 py-2.5 text-xs font-medium text-signal-stop">{error}</div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? <Spinner /> : mode === 'login' ? 'Enter console' : 'Create account'}
              {!loading && <ArrowRight size={15} />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Demo credentials are pre-filled — any role works without a live backend.
          </p>
        </div>
      </div>
    </div>
  );
}
