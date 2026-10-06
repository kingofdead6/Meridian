import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus } from 'lucide-react';
import api from '../lib/api';
import { useAction, useList } from '../lib/hooks';
import { date, money, titleCase } from '../lib/format';
import { Button, EmptyState, PageHeader, Select, Spinner, StatusBadge } from '../components/ui';
import { Drawer } from '../components/ui/Overlay';
import FormFields, { fromFormValues } from '../components/FormFields';

export const PROJECT_FIELDS = [
  { name: 'name', label: 'Project name', required: true, span: 'full' },
  { name: 'client', label: 'Client', type: 'relation', resource: 'contacts', params: { type: 'customer,both' } },
  { name: 'status', label: 'Status', type: 'select', required: true, options: ['planning', 'active', 'on_hold', 'completed'].map((s) => ({ value: s, label: titleCase(s) })) },
  { name: 'startDate', label: 'Start', type: 'date' },
  { name: 'dueDate', label: 'Due', type: 'date' },
  { name: 'budget', label: 'Budget', type: 'money' },
  { name: 'color', label: 'Colour', type: 'color' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function Projects() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const { data, isLoading } = useList('projects', { status, limit: 100 });
  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState({});
  const create = useAction((body) => api.post('/projects', body).then((r) => r.data), { success: 'Project created', onSuccess: (p) => navigate(`/projects/${p._id}`) });
  const projects = data?.data || [];

  return (
    <div>
      <PageHeader title="Projects" description="Client work broken into tasks, from planning to sign-off."
        actions={<Button variant="primary" icon={Plus} onClick={() => { setValues({ status: 'planning', color: '#2E6B4E' }); setCreating(true); }}>New project</Button>} />
      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="mb-4 w-auto min-w-[170px]" aria-label="Status">
        <option value="">All projects</option>
        {['planning', 'active', 'on_hold', 'completed'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
      </Select>

      {isLoading ? <div className="flex justify-center py-20"><Spinner /></div> : !projects.length ? (
        <div className="sheet"><EmptyState icon={FolderKanban} title="No projects yet" action={<Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Start a project</Button>}>Projects group tasks for a client or an internal goal.</EmptyState></div>
      ) : (
        <ul className="sheet divide-y divide-rule-2 overflow-hidden">
          {projects.map((p) => {
            const pct = p.taskCount ? Math.round((p.doneCount / p.taskCount) * 100) : 0;
            return (
              <li key={p._id}>
                <button onClick={() => navigate(`/projects/${p._id}`)} className="grid w-full items-center gap-x-6 gap-y-2 px-5 py-4 text-left hover:bg-paper-2 md:grid-cols-[6px_1.6fr_1fr_1.2fr_auto]">
                  <span className="hidden h-10 rounded-full md:block" style={{ background: p.color }} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{p.name}</p>
                    <p className="truncate text-[13px] text-muted">{p.client?.name || 'Internal'}</p>
                  </div>
                  <div><StatusBadge status={p.status} /></div>
                  <div>
                    <div className="mb-1 flex justify-between text-[12.5px] text-muted"><span className="num">{p.doneCount} of {p.taskCount} tasks</span><span className="num">{pct}%</span></div>
                    <div className="h-1.5 rounded-full bg-rule-2"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} /></div>
                  </div>
                  <div className="text-right text-[13px]">
                    <p className="font-medium num">{money(p.budget, { compact: true })}</p>
                    <p className="text-muted">Due {date(p.dueDate)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Drawer open={creating} onClose={() => setCreating(false)} title="New project"
        footer={<><Button onClick={() => setCreating(false)}>Cancel</Button><Button variant="primary" type="submit" form="project-form" loading={create.isPending}>Create project</Button></>}>
        <form id="project-form" onSubmit={(e) => { e.preventDefault(); create.mutate(fromFormValues(PROJECT_FIELDS, values)); }}>
          <FormFields fields={PROJECT_FIELDS} values={values} onChange={setValues} />
        </form>
      </Drawer>
    </div>
  );
}
