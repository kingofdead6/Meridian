import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useAction, useList, useRecord } from '../lib/hooks';
import { date, money, shortDate, titleCase } from '../lib/format';
import { Avatar, Badge, Button, Spinner, StatusBadge } from '../components/ui';
import { Drawer, useConfirm } from '../components/ui/Overlay';
import Kanban from '../components/Kanban';
import FormFields, { fromFormValues, toFormValues } from '../components/FormFields';
import { PROJECT_FIELDS } from './Projects';

const COLUMNS = [
  { key: 'todo', label: 'To do', accent: '#98A1A9' },
  { key: 'in_progress', label: 'In progress', accent: '#3A5A8C' },
  { key: 'review', label: 'Review', accent: '#A86E14' },
  { key: 'done', label: 'Done', accent: '#2E6B4E' },
];
const TASK_FIELDS = [
  { name: 'title', label: 'Task', required: true, span: 'full' },
  { name: 'status', label: 'Column', type: 'select', required: true, options: COLUMNS.map((c) => ({ value: c.key, label: c.label })) },
  { name: 'priority', label: 'Priority', type: 'select', required: true, options: ['low', 'medium', 'high'].map((p) => ({ value: p, label: titleCase(p) })) },
  { name: 'assignee', label: 'Assignee', type: 'relation', resource: 'directory' },
  { name: 'dueDate', label: 'Due', type: 'date' },
  { name: 'estimateHours', label: 'Estimate (hours)', type: 'number' },
  { name: 'description', label: 'Details', type: 'textarea' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: project, isLoading } = useRecord(`projects/${id}`);
  const params = { project: id, limit: 500 };
  const { data } = useList('tasks', params);
  const tasks = data?.data || [];
  const [task, setTask] = useState(null);
  const [taskValues, setTaskValues] = useState({});
  const [editProject, setEditProject] = useState(false);
  const [projectValues, setProjectValues] = useState({});
  const [confirm, dialog] = useConfirm();

  const isNewTask = task && !task._id;
  const saveTask = useAction((body) => (isNewTask ? api.post('/tasks', { ...body, project: id }) : api.put(`/tasks/${task._id}`, body)), { success: isNewTask ? 'Task added' : 'Task saved', onSuccess: () => setTask(null) });
  const deleteTask = useAction(() => api.delete(`/tasks/${task._id}`), { success: 'Task deleted', onSuccess: () => setTask(null) });
  const saveProject = useAction((body) => api.put(`/projects/${id}`, body), { success: 'Project saved', onSuccess: () => setEditProject(false) });
  const deleteProject = useAction(() => api.delete(`/projects/${id}`), { success: 'Project deleted', onSuccess: () => navigate('/projects') });

  const openTask = (t, status = 'todo') => { setTask(t || {}); setTaskValues(toFormValues(TASK_FIELDS, t, { status, priority: 'medium' })); };

  const move = async (t, status, index) => {
    const key = ['tasks', params];
    const previous = qc.getQueryData(key);
    const col = tasks.filter((x) => x.status === status && x._id !== t._id).sort((a, b) => a.position - b.position);
    col.splice(index, 0, t);
    const pos = new Map(col.map((x, i) => [x._id, i]));
    qc.setQueryData(key, { ...previous, data: tasks.map((x) => (pos.has(x._id) ? { ...x, status, position: pos.get(x._id) } : x)) });
    try { await api.patch(`/tasks/${t._id}/move`, { status, position: index, scope: 'project' }); }
    catch (e) { qc.setQueryData(key, previous); toast.error(errorMessage(e)); }
  };

  if (isLoading || !project) return <div className="flex justify-center py-24"><Spinner /></div>;
  const done = tasks.filter((t) => t.status === 'done').length;

  return (
    <div>
      <Link to="/projects" className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-graphite"><ArrowLeft className="size-4" /> Projects</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="size-3 rounded-full" style={{ background: project.color }} />
            <h1 className="text-[26px] font-semibold text-ink">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.description && <p className="mt-1.5 text-muted">{project.description}</p>}
          <p className="mt-2 text-[13.5px] text-muted">
            {project.client?.name || 'Internal'} · {date(project.startDate)} to {date(project.dueDate)} · budget {money(project.budget, { compact: true })} · <span className="num">{done}/{tasks.length}</span> tasks done
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={Pencil} onClick={() => { setProjectValues(toFormValues(PROJECT_FIELDS, project)); setEditProject(true); }}>Edit</Button>
          <Button variant="primary" icon={Plus} onClick={() => openTask(null)}>Add task</Button>
        </div>
      </div>

      <Kanban columns={COLUMNS} items={tasks} columnOf={(t) => t.status} onMove={move} onCardClick={openTask}
        renderCard={(t) => (
          <div>
            <p className="font-medium leading-snug">{t.title}</p>
            <div className="mt-2.5 flex items-center gap-2">
              <Badge tone={{ high: 'red', medium: 'blue', low: 'neutral' }[t.priority]}>{titleCase(t.priority)}</Badge>
              {t.dueDate && <span className="inline-flex items-center gap-1 text-[12px] text-muted"><CalendarClock className="size-3.5" />{shortDate(t.dueDate)}</span>}
              {t.assignee && <Avatar name={t.assignee.name} src={t.assignee.avatar?.url} size={22} className="ml-auto" />}
            </div>
          </div>
        )} />

      <Drawer open={Boolean(task)} onClose={() => setTask(null)} title={isNewTask ? 'New task' : 'Edit task'}
        footer={<>
          {!isNewTask && <Button variant="danger" icon={Trash2} className="mr-auto" onClick={() => deleteTask.mutate()} loading={deleteTask.isPending}>Delete</Button>}
          <Button onClick={() => setTask(null)}>Cancel</Button>
          <Button variant="primary" type="submit" form="task-form" loading={saveTask.isPending}>{isNewTask ? 'Add task' : 'Save task'}</Button>
        </>}>
        <form id="task-form" onSubmit={(e) => { e.preventDefault(); saveTask.mutate(fromFormValues(TASK_FIELDS, taskValues)); }}>
          <FormFields fields={TASK_FIELDS} values={taskValues} onChange={setTaskValues} />
        </form>
      </Drawer>

      <Drawer open={editProject} onClose={() => setEditProject(false)} title="Edit project"
        footer={<>
          <Button variant="danger" icon={Trash2} className="mr-auto" loading={deleteProject.isPending}
            onClick={async () => (await confirm({ title: 'Delete this project?', message: 'Its tasks are deleted too.', confirmLabel: 'Delete', danger: true })) && deleteProject.mutate()}>Delete</Button>
          <Button onClick={() => setEditProject(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="edit-project-form" loading={saveProject.isPending}>Save changes</Button>
        </>}>
        <form id="edit-project-form" onSubmit={(e) => { e.preventDefault(); saveProject.mutate(fromFormValues(PROJECT_FIELDS, projectValues)); }}>
          <FormFields fields={PROJECT_FIELDS} values={projectValues} onChange={setProjectValues} />
        </form>
      </Drawer>
      {dialog}
    </div>
  );
}
