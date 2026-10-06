import ResourcePage from '../components/ResourcePage';
import { money } from '../lib/format';

export default function Departments() {
  return (
    <ResourcePage
      title="Departments"
      description="Teams, their headcount and what they cost each month."
      resource="departments"
      entity="Department"
      module="hr"
      defaults={{ color: '#2E6B4E' }}
      fields={[
        { name: 'name', label: 'Name', required: true, span: 'full' },
        { name: 'color', label: 'Colour', type: 'color', span: 'full' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      columns={[
        { key: 'name', label: 'Department', render: (r) => <span className="inline-flex items-center gap-2.5 font-medium"><span className="size-2.5 rounded-full" style={{ background: r.color }} />{r.name}</span> },
        { key: 'description', label: 'About', render: (r) => <span className="text-muted">{r.description || '—'}</span> },
        { key: 'headcount', label: 'People', align: 'right' },
        { key: 'payroll', label: 'Monthly salaries', align: 'right', render: (r) => money(r.payroll) },
      ]}
    />
  );
}
