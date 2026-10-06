import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';
import { Button, Field, Input } from '../components/ui';
import Logo from '../components/layout/Logo';
import LedgerAnimation from '../components/LedgerAnimation';

const DEMO = [
  ['admin', 'Administrator'], ['accountant', 'Accountant'], ['sales', 'Sales'],
  ['warehouse', 'Warehouse'], ['hr', 'People & HR'], ['manager', 'Manager'],
];

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', name: '', companyName: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'signin') await login(form.email, form.password);
      else await register(form);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-10 lg:flex">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-40 size-[520px] rounded-full bg-ledger/30 blur-[120px] animate-drift" />
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines" />
        <Link to="/" className="relative w-fit"><Logo /></Link>
        <div className="relative mx-auto w-full max-w-[560px]">
          <h1 className="mb-3 text-[34px] font-semibold leading-[1.15] text-white">Every sale, purchase and payment posts itself to the books.</h1>
          <p className="mb-9 max-w-[46ch] text-[15.5px] leading-relaxed text-ink-text">
            Sales, stock, purchasing, accounting and people in one system. Documents move from draft to posted, and the ledger always balances.
          </p>
          <LedgerAnimation />
        </div>
        <p className="relative text-[13px] text-[#7C8BA3]">Meridian ERP · open-source demo</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px]">
          <Link to="/" className="group mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to the website
          </Link>
          <div className="mb-8 lg:hidden"><Logo light={false} /></div>
          <h2 className="text-[24px] font-semibold text-ink">{mode === 'signin' ? 'Sign in to Meridian' : 'Create your workspace'}</h2>
          <p className="mt-1 text-muted">{mode === 'signin' ? 'Use your work email, or explore with a demo role below.' : 'You become the administrator of a new company.'}</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'register' && (
              <>
                <Field label="Company name"><Input required value={form.companyName} onChange={set('companyName')} autoComplete="organization" /></Field>
                <Field label="Your name"><Input required value={form.name} onChange={set('name')} autoComplete="name" /></Field>
              </>
            )}
            <Field label="Email"><Input type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></Field>
            <Field label="Password" hint={mode === 'register' ? 'At least 8 characters' : undefined}>
              <Input type="password" required minLength={mode === 'register' ? 8 : undefined} value={form.password} onChange={set('password')} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </Field>
            {error && <p role="alert" className="rounded-lg bg-debit-soft px-3 py-2 text-[13.5px] text-debit">{error}</p>}
            <Button variant="primary" type="submit" loading={busy} className="h-10 w-full">{mode === 'signin' ? 'Sign in' : 'Create workspace'}</Button>
          </form>

          <p className="mt-4 text-center text-[13.5px] text-muted">
            {mode === 'signin' ? 'New company? ' : 'Already have an account? '}
            <button className="font-medium text-ledger hover:underline" onClick={() => { setMode(mode === 'signin' ? 'register' : 'signin'); setError(''); }}>
              {mode === 'signin' ? 'Create a workspace' : 'Sign in'}
            </button>
          </p>

          {mode === 'signin' && (
            <div className="mt-9 border-t border-rule pt-6">
              <p className="mb-3 text-[13px] font-medium text-graphite">Try the demo company as</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO.map(([role, label]) => (
                  <button key={role} type="button" onClick={() => setForm((f) => ({ ...f, email: `${role}@meridian.demo`, password: 'demo1234' }))}
                    className={`rounded-lg border px-3 py-2 text-left text-[13.5px] transition-colors ${form.email === `${role}@meridian.demo` ? 'border-ledger bg-ledger-soft text-ledger-2' : 'border-rule bg-sheet hover:border-[#C5CDC2]'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2.5 text-[12.5px] text-muted">Each role sees only the modules it is allowed to use.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
