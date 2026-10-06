import ResourcePage from '../components/ResourcePage';
import { Avatar, StatusBadge } from '../components/ui';
import { date, money } from '../lib/format';
import { useOptions } from '../lib/hooks';

const FIELDS = [
  { name: 'avatar', label: 'Photo', type: 'image', folder: 'employees', round: true },
  { name: 'firstName', label: 'First name', required: true },
  { name: 'lastName', label: 'Last name', required: true },
  { name: 'email', label: 'Work email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'department', label: 'Department', type: 'relation', resource: 'departments' },
  { name: 'position', label: 'Position' },
  { name: 'hireDate', label: 'Hire date', type: 'date' },
  { name: 'salary', label: 'Monthly salary', type: 'money', hint: 'Gross, before deductions' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'active', label: 'Active' }, { value: 'on_leave', label: 'On leave' }, { value: 'terminated', label: 'Left the company' }] },
  { name: 'leaveBalance', label: 'Annual leave left (days)', type: 'number' },
  { name: 'address', label: 'Address', span: 'full' },
];

export default function Employees() {
  const departments = useOptions('departments');
  return (
    <ResourcePage
      title="Employees"
      description="Everyone on the payroll. Salaries feed straight into monthly payroll runs."
      resource="employees"
      entity="Employee"
      module="hr"
      searchPlaceholder="Search by name, email or position"
      defaults={{ status: 'active', leaveBalance: 21 }}
      filters={[
        { name: 'department', label: 'All departments', options: departments.map((d) => ({ value: d._id, label: d.name })) },
        { name: 'status', label: 'Any status', options: [{ value: 'active', label: 'Active' }, { value: 'on_leave', label: 'On leave' }, { value: 'terminated', label: 'Left' }] },
      ]}
      fields={FIELDS}
      columns={[
        { key: 'name', label: 'Name', render: (r) => (
          <div className="flex items-center gap-3">
            <Avatar name={`${r.firstName} ${r.lastName}`} src={r.avatar?.url} size={34} />
            <div><p className="font-medium">{r.firstName} {r.lastName}</p><p className="text-[12.5px] text-muted">{r.email}</p></div>
          </div>) },
        { key: 'position', label: 'Position' },
        { key: 'department', label: 'Department', render: (r) => r.department ? <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: r.department.color }} />{r.department.name}</span> : '—' },
        { key: 'hireDate', label: 'Joined', render: (r) => <span className="text-muted">{date(r.hireDate)}</span> },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={{ terminated: 'Left' }[r.status]} /> },
        { key: 'salary', label: 'Salary', align: 'right', render: (r) => money(r.salary) },
      ]}
    />
  );
}
