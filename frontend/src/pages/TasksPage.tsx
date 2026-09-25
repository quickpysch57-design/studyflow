import { useState, useEffect } from 'react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, Input, Badge, Modal, Skeleton, SkeletonCard } from '../components/ui';
import {
  PlusIcon, CheckCircleIcon, PencilIcon, TrashIcon, FunnelIcon,
  CalendarIcon, ClockIcon, FlagIcon, BookOpenIcon, FunnelIcon
} from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  dueDate?: string;
  startTime?: string;
  duration?: number;
  completed: boolean;
  completedAt?: string;
  subject?: { id: string; name: string; color: string };
}

const FILTERS = [
  { value: 'all', label: 'All', icon: BookOpenIcon },
  { value: 'today', label: 'Today', icon: CalendarIcon },
  { value: 'tomorrow', label: 'Tomorrow', icon: CalendarIcon },
  { value: 'week', label: 'This Week', icon: CalendarIcon },
  { value: 'overdue', label: 'Overdue', icon: FlagIcon },
  { value: 'completed', label: 'Completed', icon: CheckCircleIcon }
];

const TASK_TYPES = ['HOMEWORK', 'ASSIGNMENT', 'PROJECT', 'REVISION', 'EXAM_PREPARATION', 'PERSONAL', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    type: 'HOMEWORK',
    priority: 'MEDIUM',
    dueDate: '',
    startTime: '',
    duration: 60
  });

  useEffect(() => {
    fetchData();
  }, [filter, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        api.get('/api/tasks', { params: { filter, search: search || undefined } }),
        api.get('/api/subjects')
      ]);
      setTasks(tasksRes.data.tasks);
      setSubjects(subjectsRes.data.subjects);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (task?: Task) => {
    setEditingTask(task || null);
    setFormData(task ? {
      title: task.title,
      description: task.description || '',
      subjectId: task.subject?.id || '',
      type: task.type,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      startTime: task.startTime ? task.startTime.split('T')[1].slice(0, 5) : '',
      duration: task.duration || 60
    } : {
      title: '',
      description: '',
      subjectId: '',
      type: 'HOMEWORK',
      priority: 'MEDIUM',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '17:00',
      duration: 60
    });
    setModalOpen(true);
  };

  const saveTask = async () => {
    if (!formData.title.trim()) { toast.error('Task title required'); return; }
    try {
      const data = {
        ...formData,
        dueDate: formData.dueDate || undefined,
        startTime: formData.startTime ? `${formData.dueDate}T${formData.startTime}:00` : undefined
      };
      if (editingTask) {
        await api.patch(`/api/tasks/${editingTask.id}`, data);
        toast.success('Task updated');
      } else {
        await api.post('/api/tasks', data);
        toast.success('Task added');
      }
      closeModal();
      fetchData();
    } catch { toast.error('Failed to save task'); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/api/tasks/${id}`); toast.success('Task deleted'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleComplete = async (task: Task) => {
    try {
      await api.patch(`/api/tasks/${task.id}`, { completed: !task.completed });
      fetchData();
    } catch { toast.error('Failed to update'); }
  };

  const closeModal = () => { setModalOpen(false); setEditingTask(null); };

  const filteredTasks = tasks;
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton variant="text" width="40%" height="2rem" /><Skeleton variant="text" width="20%" height="2rem" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-surface-50">Tasks</h1>
          <p className="text-body-lg text-surface-400 mt-1">Stay on top of your assignments and deadlines</p>
        </div>
        <Button variant="primary" onClick={() => openModal()}><PlusIcon className="h-5 w-5" /> Add Task</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
              <input
                type="search"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-50 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-body-sm font-medium transition-all ${
                    filter === f.value
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
                  }`}
                >
                  <f.icon className="h-4 w-4" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={stats.total} color="text-surface-50" />
        <StatCard label="Completed" value={stats.completed} color="text-green-400" />
        <StatCard label="Pending" value={stats.pending} color="text-yellow-400" />
        <StatCard label="Overdue" value={stats.overdue} color="text-red-400" />
      </div>

      {filteredTasks.length === 0 ? (
        <Card className="text-center py-16">
          <CheckCircleIcon className="h-16 w-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-heading-md font-semibold text-surface-50 mb-2">No tasks found</h3>
          <p className="text-surface-400 mb-6">{" "}
            {filter === 'today' ? "No tasks for today" :
             filter === 'tomorrow' ? "No tasks for tomorrow" :
             filter === 'week' ? "No tasks this week" :
             filter === 'overdue' ? "No overdue tasks! 🎉" :
             filter === 'completed' ? "No completed tasks yet" :
             "No tasks yet"}
          </p>
          <Button variant="primary" onClick={() => openModal()}>
            <PlusIcon className="h-5 w-5" /> Add Your First Task
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={toggleComplete} onEdit={openModal} onDelete={deleteTask} />
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingTask ? 'Edit Task' : 'Add Task'} size="lg">
        <div className="space-y-4">
          <Input label="Title" placeholder="e.g., Complete Math homework" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} error={!formData.title && editingTask ? 'Required' : undefined} />
          <Input label="Description (optional)" placeholder="Details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <select className="input" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})}>
              <option value="">General (No subject)</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              {TASK_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select className="input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <Input label="Due Date" type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
            <Input label="Duration (min)" type="number" min={5} max={480} value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={saveTask}>{editingTask ? 'Save Changes' : 'Add Task'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: (t: Task) => void; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && !task.completed;
  const isToday = dueDate && isToday(dueDate);
  const isTomorrow = dueDate && isTomorrow(dueDate);

  let dateLabel = dueDate ? format(dueDate, 'MMM d') : 'No due date';
  if (isToday) dateLabel = 'Today';
  else if (isTomorrow) dateLabel = 'Tomorrow';

  const priorityColors: Record<string, string> = {
    LOW: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400',
    URGENT: 'text-red-400'
  };

  return (
    <Card variant="hover" className={`${task.completed ? 'opacity-60' : ''} ${isOverdue && !task.completed ? 'border-red-500/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={() => onToggle(task)} className="flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle(task)}
              className="w-5 h-5 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500"
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium truncate ${task.completed ? 'line-through text-surface-500' : 'text-surface-50'}`}>{task.title}</h3>
              <Badge variant="outline" className="text-xs" style={{ color: priorityColors[task.priority], borderColor: priorityColors[task.priority].replace('text-', '') }}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">{task.type.replace('_', ' ')}</Badge>
              {task.subject && (
                <Badge variant="outline" className="text-xs" style={{ borderColor: task.subject.color, color: task.subject.color }}>
                  {task.subject.name}
                </Badge>
              )}
            </div>
            {task.description && <p className="text-body-sm text-surface-400 mt-1 line-clamp-2">{task.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-body-xs text-surface-500">
              {dueDate && (
                <span className={`flex items-center gap-1 ${isOverdue && !task.completed ? 'text-red-400' : ''}`}>
                  <CalendarIcon className="h-3.5 w-3.5" /> {dateLabel}
                </span>
              )}
              {task.startTime && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" /> {format(new Date(task.startTime), 'h:mm a')} ({task.duration}min)
                </span>
              )}
              {task.completed && task.completedAt && (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircleIcon className="h-3.5 w-3.5" /> Done {format(new Date(task.completedAt), 'MMM d, h:mm a')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800" aria-label="Edit"><PencilIcon className="h-4 w-4" /></button>
            <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-800" aria-label="Delete"><TrashIcon className="h-4 w-4" /></button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 text-center">
      <p className={`text-heading-lg font-bold ${color}`}>{value}</p>
      <p className="text-body-xs text-surface-500">{label}</p>
    </div>
  );
}