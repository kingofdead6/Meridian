import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../lib/api';
import { useAction, useList } from '../lib/hooks';
import { money } from '../lib/format';
import { Button, Field, Input, PageHeader, StatusBadge } from '../components/ui';
import DataTable from '../components/ui/DataTable';
import { Modal } from '../components/ui/Overlay';

const periodLabel = (p) => { const [y, m] = p.split('-'); return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); };

export default function Payroll() {
  const navigate = useNavigate();
  const { data, isLoading } = useList('payroll', { limit: 50 });
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const create = useAction(() => api.post('/payroll', { period }).then((r) => r.data), { success: 'Payroll prepared', onSuccess: (run) => navigate(`/hr/payroll/${run._id}`) });

  return (
    <div>
      <PageHeader title="Payroll" description="Monthly salary runs. Each run calculates deductions, and posting it pays net salaries from the bank."
        actions={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>Prepare payroll</Button>} />
      <DataTable loading={isLoading} rows={data?.data || []} onRowClick={(r) => navigate(`/hr/payroll/${r._id}`)} columns={[
        { key: 'period', label: 'Month', render: (r) => <span className="font-medium">{periodLabel(r.period)}</span> },
        { key: 'number', label: 'Run', render: (r) => <span className="text-muted">{r.number}</span> },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={r.status === 'posted' ? 'Paid' : 'Draft'} /> },
        { key: 'totalGross', label: 'Gross', align: 'right', render: (r) => money(r.totalGross) },
        { key: 'totalDeductions', label: 'Deductions', align: 'right', render: (r) => <span className="text-muted">{money(r.totalDeductions)}</span> },
        { key: 'totalNet', label: 'Net pay', align: 'right', render: (r) => <span className="font-medium">{money(r.totalNet)}</span> },
      ]} />
      <Modal open={open} onClose={() => setOpen(false)} title="Prepare payroll"
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" loading={create.isPending} onClick={() => create.mutate()}>Prepare</Button></>}>
        <Field label="Month" hint="Includes every active employee with a salary. Nothing is posted until you review it.">
          <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}
