import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAction, useList } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { money } from '../lib/format';
import { Badge, Button, IconButton, PageHeader, Spinner } from '../components/ui';
import { Drawer, useConfirm } from '../components/ui/Overlay';
import FormFields, { fromFormValues, toFormValues } from '../components/FormFields';

const TYPES = [
  { value: 'asset', label: 'Assets', note: 'What the business owns' },
  { value: 'liability', label: 'Liabilities', note: 'What it owes' },
  { value: 'equity', label: 'Equity', note: "Owners' stake" },
  { value: 'income', label: 'Income', note: 'Money earned' },
  { value: 'expense', label: 'Expenses', note: 'Money spent' },
];

const FIELDS = [
  { name: 'code', label: 'Code', required: true },
  { name: 'name', label: 'Name', required: true },
  { name: 'type', label: 'Type', type: 'select', required: true, options: TYPES.map((t) => ({ value: t.value, label: t.label.replace(/s$/, '') })) },
  { name: 'isCash', type: 'checkbox', checkboxLabel: 'Cash or bank account — can send and receive payments', hidden: (v) => v.type !== 'asset' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'active', type: 'checkbox', checkboxLabel: 'Active' },
];

export default function Accounts() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { data, isLoading } = useList('accounts');
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [confirm, dialog] = useConfirm();
  const isNew = editing && !editing._id;

  const open = (acc) => { setEditing(acc || {}); setValues(toFormValues(FIELDS, acc, { type: 'expense', active: true })); };
  const save = useAction((body) => (isNew ? api.post('/accounts', body) : api.put(`/accounts/${editing._id}`, body)), { success: 'Account saved', onSuccess: () => setEditing(null) });
  const remove = useAction(() => api.delete(`/accounts/${editing._id}`), { success: 'Account deleted', onSuccess: () => setEditing(null) });

  const accounts = data?.data || [];
  return (
    <div>
      <PageHeader title="Chart of accounts" description="Every amount in Meridian lands in one of these accounts. Balances include all posted entries."
        actions={can('accounting') && <Button variant="primary" icon={Plus} onClick={() => open(null)}>New account</Button>} />
      {isLoading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="space-y-6">
          {TYPES.map((t) => {
            const rows = accounts.filter((a) => a.type === t.value);
            const total = rows.reduce((s, a) => s + a.balance, 0);
            return (
              <section key={t.value} className="sheet overflow-hidden">
                <header className="flex items-baseline justify-between border-b border-rule bg-paper-2 px-5 py-3">
                  <h2 className="font-semibold text-ink">{t.label} <span className="ml-1 font-normal text-muted">{t.note}</span></h2>
                  <span className="font-semibold num">{money(total)}</span>
                </header>
                <ul className="divide-y divide-rule-2">
                  {rows.map((a) => (
                    <li key={a._id} className="group flex cursor-pointer items-center gap-4 px-5 py-2.5 hover:bg-paper-2" onClick={() => navigate(`/accounting/accounts/${a._id}`)}>
                      <span className="w-12 text-muted num">{a.code}</span>
                      <span className={a.active ? 'font-medium' : 'text-faint line-through'}>{a.name}</span>
                      {a.isCash && <Badge tone="green" dot={false}>Cash</Badge>}
                      {a.systemKey && <span className="text-[12px] text-faint">used by automatic postings</span>}
                      <span className="ml-auto font-medium num">{money(a.balance)}</span>
                      {can('accounting') && <IconButton icon={Pencil} label={`Edit ${a.name}`} className="opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={(e) => { e.stopPropagation(); open(a); }} />}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={isNew ? 'New account' : `${editing?.code} ${editing?.name}`}
        footer={<>
          {!isNew && !editing?.systemKey && <Button variant="danger" icon={Trash2} className="mr-auto" loading={remove.isPending} onClick={async () => (await confirm({ title: 'Delete this account?', message: 'Only accounts without postings can be deleted.', confirmLabel: 'Delete', danger: true })) && remove.mutate()}>Delete</Button>}
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="primary" type="submit" form="account-form" loading={save.isPending}>{isNew ? 'Create account' : 'Save changes'}</Button>
        </>}>
        <form id="account-form" onSubmit={(e) => { e.preventDefault(); save.mutate(fromFormValues(FIELDS, values)); }}>
          <FormFields fields={FIELDS} values={values} onChange={setValues} />
        </form>
      </Drawer>
      {dialog}
    </div>
  );
}
