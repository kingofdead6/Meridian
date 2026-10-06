import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import api from '../lib/api';
import { useAction, useList, useOptions } from '../lib/hooks';
import { date, titleCase, today } from '../lib/format';
import { Avatar, Button, Field, Input, PageHeader, Select, StatusBadge, Tabs, Textarea } from '../components/ui';
import DataTable from '../components/ui/DataTable';
import { Drawer } from '../components/ui/Overlay';

export default function Leaves() {
  const [status, setStatus] = useState('pending');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({});
  const { data, isLoading } = useList('leaves', { status: status === 'all' ? undefined : status, limit: 100 });
  const pending = useList('leaves', { status: 'pending', limit: 1 });
  const employees = useOptions('employees', { status: 'active,on_leave' });

  const decide = useAction(({ id, decision }) => api.patch(`/leaves/${id}/${decision}`), { success: (_, v) => (v.decision === 'approve' ? 'Leave approved' : 'Leave declined') });
  const create = useAction(() => api.post('/leaves', form), { success: 'Request submitted', onSuccess: () => setCreating(false) });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHeader title="Leave" description="Requests for time off. Approving annual leave deducts it from the employee's balance."
        actions={<Button variant="primary" icon={Plus} onClick={() => { setForm({ employee: '', type: 'annual', startDate: today(), endDate: today(), reason: '' }); setCreating(true); }}>New request</Button>} />
      <Tabs className="mb-4" value={status} onChange={setStatus} tabs={[
        { value: 'pending', label: 'Waiting for review', count: pending.data?.total }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Declined' }, { value: 'all', label: 'All' },
      ]} />
      <DataTable loading={isLoading} rows={data?.data || []} columns={[
        { key: 'employee', label: 'Employee', render: (r) => (
          <div className="flex items-center gap-3">
            <Avatar name={`${r.employee?.firstName} ${r.employee?.lastName}`} src={r.employee?.avatar?.url} size={32} />
            <div><p className="font-medium">{r.employee?.firstName} {r.employee?.lastName}</p><p className="text-[12.5px] text-muted">{r.employee?.leaveBalance} days left</p></div>
          </div>) },
        { key: 'type', label: 'Type', render: (r) => titleCase(r.type) },
        { key: 'dates', label: 'Dates', render: (r) => <span>{date(r.startDate)} – {date(r.endDate)}</span> },
        { key: 'days', label: 'Working days', align: 'right' },
        { key: 'reason', label: 'Reason', render: (r) => <span className="text-muted">{r.reason || '—'}</span> },
        { key: 'status', label: 'Status', render: (r) => (r.status === 'pending' ? (
          <span className="flex gap-1.5">
            <Button size="sm" variant="primary" icon={Check} onClick={() => decide.mutate({ id: r._id, decision: 'approve' })}>Approve</Button>
            <Button size="sm" icon={X} onClick={() => decide.mutate({ id: r._id, decision: 'reject' })}>Decline</Button>
          </span>
        ) : <StatusBadge status={r.status} label={{ rejected: 'Declined' }[r.status]} />) },
      ]} />

      <Drawer open={creating} onClose={() => setCreating(false)} title="New leave request"
        footer={<><Button onClick={() => setCreating(false)}>Cancel</Button><Button variant="primary" type="submit" form="leave-form" loading={create.isPending}>Submit request</Button></>}>
        <form id="leave-form" className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Field label="Employee" className="sm:col-span-2">
            <Select value={form.employee} onChange={set('employee')} required>
              <option value="">Choose…</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.firstName} {e.lastName} · {e.leaveBalance} days left</option>)}
            </Select>
          </Field>
          <Field label="Type" className="sm:col-span-2">
            <Select value={form.type} onChange={set('type')}>{['annual', 'sick', 'unpaid', 'other'].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select>
          </Field>
          <Field label="First day"><Input type="date" value={form.startDate} onChange={set('startDate')} required /></Field>
          <Field label="Last day"><Input type="date" value={form.endDate} onChange={set('endDate')} required /></Field>
          <Field label="Reason" className="sm:col-span-2"><Textarea value={form.reason} onChange={set('reason')} /></Field>
          <p className="text-[13px] text-muted sm:col-span-2">Weekends are not counted.</p>
        </form>
      </Drawer>
    </div>
  );
}
