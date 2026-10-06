import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../lib/api';
import { useAction } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/nav';
import { date } from '../lib/format';
import { Avatar, Badge, Button, Field, Input, PageHeader, Panel, Select, Tabs, Textarea } from '../components/ui';
import ImageUpload from '../components/ui/ImageUpload';
import ResourcePage from '../components/ResourcePage';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'DZD', 'MAD', 'TND', 'AED', 'SAR', 'CAD', 'AUD'];

function RateList({ value, onChange, unit = '%' }) {
  return (
    <div className="space-y-2">
      {value.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={r.name} onChange={(e) => onChange(value.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} placeholder="Name" />
          <div className="relative w-32 shrink-0">
            <Input type="number" step="0.01" className="pr-7 text-right num" value={r.rate} onChange={(e) => onChange(value.map((x, idx) => (idx === i ? { ...x, rate: Number(e.target.value) } : x)))} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint">{unit}</span>
          </div>
          <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="rounded-md p-2 text-faint hover:bg-debit-soft hover:text-debit" aria-label="Remove"><X className="size-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { name: '', rate: 0 }])} className="inline-flex items-center gap-1 text-[14px] font-medium text-ledger hover:underline"><Plus className="size-4" />Add</button>
    </div>
  );
}

function CompanyForm() {
  const { company, refresh } = useAuth();
  const [form, setForm] = useState(company);
  useEffect(() => setForm(company), [company]);
  const save = useAction(() => api.put('/company', form), { success: 'Company settings saved', onSuccess: refresh });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6">
      <Panel title="Company" bodyClassName="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Logo" className="sm:col-span-2" hint="Shown on invoices and PDFs"><ImageUpload value={form.logo} onChange={(logo) => setForm((f) => ({ ...f, logo }))} folder="branding" /></Field>
        <Field label="Trading name"><Input value={form.name || ''} onChange={set('name')} required /></Field>
        <Field label="Legal name"><Input value={form.legalName || ''} onChange={set('legalName')} /></Field>
        <Field label="Email"><Input type="email" value={form.email || ''} onChange={set('email')} /></Field>
        <Field label="Phone"><Input value={form.phone || ''} onChange={set('phone')} /></Field>
        <Field label="Address" className="sm:col-span-2"><Input value={form.address || ''} onChange={set('address')} /></Field>
        <Field label="City"><Input value={form.city || ''} onChange={set('city')} /></Field>
        <Field label="Country"><Input value={form.country || ''} onChange={set('country')} /></Field>
        <Field label="Tax ID"><Input value={form.taxId || ''} onChange={set('taxId')} /></Field>
        <Field label="Website"><Input value={form.website || ''} onChange={set('website')} /></Field>
      </Panel>
      <Panel title="Invoicing" bodyClassName="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Currency" hint="Changing it relabels amounts; it does not convert them">
          <Select value={form.currency} onChange={set('currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select>
        </Field>
        <Field label="Default payment terms (days)"><Input type="number" min="0" value={form.paymentTermsDays ?? 30} onChange={(e) => setForm((f) => ({ ...f, paymentTermsDays: Number(e.target.value) }))} /></Field>
        <Field label="Note printed on invoices" className="sm:col-span-2"><Textarea value={form.invoiceNote || ''} onChange={set('invoiceNote')} /></Field>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Tax rates" bodyClassName="p-5"><RateList value={form.taxRates || []} onChange={(taxRates) => setForm((f) => ({ ...f, taxRates }))} /></Panel>
        <Panel title="Payroll deductions" bodyClassName="p-5">
          <p className="mb-3 text-[13px] text-muted">Percentages of gross salary withheld in each payroll run.</p>
          <RateList value={form.payrollDeductions || []} onChange={(payrollDeductions) => setForm((f) => ({ ...f, payrollDeductions }))} />
        </Panel>
      </div>
      <div className="flex justify-end"><Button variant="primary" type="submit" loading={save.isPending}>Save settings</Button></div>
    </form>
  );
}

function Account() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const saveProfile = useAction(() => api.put('/auth/me', { name, avatar }), { success: 'Profile saved', onSuccess: refresh });
  const savePw = useAction(() => api.put('/auth/password', pw), { success: 'Password changed', onSuccess: () => setPw({ currentPassword: '', newPassword: '' }) });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Your profile" bodyClassName="space-y-4 p-5">
        <ImageUpload value={avatar} onChange={setAvatar} folder="avatars" round label="Upload photo" />
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><Input value={user.email} disabled /></Field>
        <Button variant="primary" onClick={() => saveProfile.mutate()} loading={saveProfile.isPending}>Save profile</Button>
      </Panel>
      <Panel title="Password" bodyClassName="space-y-4 p-5">
        <Field label="Current password"><Input type="password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} autoComplete="current-password" /></Field>
        <Field label="New password" hint="At least 8 characters"><Input type="password" minLength={8} value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} autoComplete="new-password" /></Field>
        <Button onClick={() => savePw.mutate()} loading={savePw.isPending} disabled={pw.newPassword.length < 8}>Change password</Button>
      </Panel>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('company');
  return (
    <div>
      <PageHeader title="Settings" description="Company details, tax and payroll rules, and who can sign in." />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ value: 'company', label: 'Company' }, { value: 'users', label: 'Users and roles' }, { value: 'account', label: 'Your account' }]} />
      {tab === 'company' && <CompanyForm />}
      {tab === 'account' && <Account />}
      {tab === 'users' && (
        <ResourcePage embedded resource="users" entity="User" module="settings" searchPlaceholder="Search by name or email"
          defaults={{ role: 'sales', active: true }}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'role', label: 'Role', type: 'select', required: true, options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })), hint: 'Decides which modules they can open' },
            { name: 'password', label: 'Password', type: 'password', hint: 'Required for new users. Leave empty to keep the current one.' },
            { name: 'active', type: 'checkbox', checkboxLabel: 'Can sign in' },
          ]}
          columns={[
            { key: 'name', label: 'Name', render: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} src={r.avatar?.url} size={30} /><span><span className="block font-medium">{r.name}</span><span className="text-[12.5px] text-muted">{r.email}</span></span></span> },
            { key: 'role', label: 'Role', render: (r) => ROLE_LABELS[r.role] },
            { key: 'lastLogin', label: 'Last sign-in', render: (r) => <span className="text-muted">{r.lastLogin ? date(r.lastLogin) : 'Never'}</span> },
            { key: 'active', label: '', align: 'right', render: (r) => (r.active ? <Badge tone="green">Active</Badge> : <Badge>Disabled</Badge>) },
          ]} />
      )}
    </div>
  );
}
