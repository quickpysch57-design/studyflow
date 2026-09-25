import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfDay, addDays, differenceInDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, Input, Badge, Modal, Skeleton, SkeletonCard } from '../components/ui';
import {
  PlusIcon, CalendarDaysIcon, ClockIcon, BookOpenIcon,
  PencilIcon, TrashIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon,
  SunIcon, MoonIcon, AcademicCapIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from '../components/ui/Toast';

interface PlannerBlock {
  id: string;
  title: string;
  subjectId?: string;
  subject?: { name: string; color: string };
  date: string;
  startTime: string;
  duration: number;
  type: string;
  completed: boolean;
  description?: string;
}

interface Subject { id: string; name: string; color: string; }

const BLOCK_TYPES = [
  { value: 'STUDY', label: 'Study', icon: BookOpenIcon },
  { value: 'REVISION', label: 'Revision', icon: SunIcon },
  { value: 'PRACTICE', label: 'Practice', icon: DocumentTextIcon },
  { value: 'EXAM_PREP', label: 'Exam Prep', icon: AcademicCapIcon },
  { value: 'ASSIGNMENT', label: 'Assignment', icon: ClockIcon },
  { value: 'BREAK', label: 'Break', icon: MoonIcon }
];

export function PlannerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [blocks, setBlocks] = useState<PlannerBlock[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PlannerBlock | null>(null);
  const [formData, setFormData] = useState<Partial<PlannerBlock>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blocksRes, subjectsRes] = await Promise.all([
        api.get('/api/study-plans'),
        api.get('/api/subjects')
      ]);
      setSubjects(subjectsRes.data.subjects);

      const activePlan = blocksRes.data.plans.find((p: any) => p.isActive);
      if (activePlan) {
        const blocksRes = await api.get(`/api/study-plans/${activePlan.id}/blocks`, {
          params: { date: format(date, 'yyyy-MM-dd') }
        });
        setBlocks(blocksRes.data.blocks);
      }
    } catch (error) {
      console.error('Failed to fetch planner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      const newBlocks = [...blocks];
      const [moved] = newBlocks.splice(oldIndex, 1);
      newBlocks.splice(newIndex, 0, moved);
      setBlocks(newBlocks);
      await saveOrder(newBlocks);
    }
  };

  const saveOrder = async (newBlocks: PlannerBlock[]) => {
    try {
      await Promise.all(newBlocks.map((block, index) =>
        api.patch(`/api/study-plans/blocks/${block.id}`, { order: index })
      ));
    } catch (error) {
      console.error('Failed to save order:', error);
    }
  };

  const openModal = (block?: PlannerBlock) => {
    setEditingBlock(block || null);
    setFormData(block ? {
      title: block.title,
      subjectId: block.subjectId,
      date: block.date.split('T')[0],
      startTime: block.startTime.split('T')[1].slice(0, 5),
      duration: block.duration,
      type: block.type,
      description: block.description || ''
    } : {
      title: '',
      subjectId: '',
      date: format(date, 'yyyy-MM-dd'),
      startTime: '17:00',
      duration: 60,
      type: 'STUDY',
      description: ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBlock(null);
  };

  const saveBlock = async () => {
    if (!formData.title || !formData.startTime || !formData.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const startTime = `${formData.date}T${formData.startTime}:00`;
      const blockData = {
        ...formData,
        startTime,
        date: formData.date,
        userId: user?.id
      };

      if (editingBlock) {
        await api.patch(`/api/study-plans/blocks/${editingBlock.id}`, blockData);
        toast.success('Block updated');
      } else {
        const activePlanRes = await api.get('/api/study-plans');
        const activePlan = activePlanRes.data.plans.find((p: any) => p.isActive);
        if (!activePlan) {
          toast.error('No active study plan. Create one first.');
          return;
        }
        await api.post(`/api/study-plans/${activePlan.id}/blocks`, blockData);
        toast.success('Block added');
      }
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Failed to save block');
    } finally {
      setSaving(false);
    }
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Delete this study block?')) return;
    try {
      await api.delete(`/api/study-plans/blocks/${id}`);
      toast.success('Block deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete block');
    }
  };

  const toggleComplete = async (block: PlannerBlock) => {
    try {
      await api.patch(`/api/study-plans/blocks/${block.id}`, { completed: !block.completed });
      fetchData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const navDate = (days: number) => setDate(d => addDays(d, days));

  const today = startOfDay(new Date());
  const isToday = date.toDateString() === today.toDateString();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width="40%" height="2rem" />
        <Skeleton variant="text" width="60%" height="1rem" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const sortedBlocks = [...blocks].sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-surface-50">Smart Planner</h1>
          <p className="text-body-lg text-surface-400 mt-1">Organize your study schedule with drag & drop</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => navDate(-1)} aria-label="Previous day">
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setDate(new Date())}>
            {isToday ? 'Today' : format(date, 'EEEE, MMM d')}
          </Button>
          <Button variant="secondary" onClick={() => navDate(1)} aria-label="Next day">
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
          <Button variant="primary" onClick={() => openModal()} className="w-full sm:w-auto">
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Add Block</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="divide-y divide-surface-700/50">
                    {sortedBlocks.length === 0 ? (
                      <div className="p-12 text-center">
                        <CalendarDaysIcon className="h-16 w-16 text-surface-600 mx-auto mb-4" />
                        <h3 className="text-heading-sm font-semibold text-surface-50 mb-2">No study blocks yet</h3>
                        <p className="text-surface-400 mb-4">Plan your first study session for {format(date, 'EEEE, MMM d')}</p>
                        <Button variant="primary" onClick={() => openModal()}>
                          <PlusIcon className="h-5 w-5" />
                          Add Study Block
                        </Button>
                      </div>
                    ) : (
                      sortedBlocks.map((block, index) => (
                        <SortablePlannerBlock
                          key={block.id}
                          block={block}
                          index={index}
                          onToggle={toggleComplete}
                          onEdit={openModal}
                          onDelete={deleteBlock}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="p-4 border-b border-surface-700/50">
              <h2 className="text-heading-sm font-semibold text-surface-50">Quick Stats</h2>
            </div>
            <CardContent className="space-y-4">
              <StatItem label="Total Blocks" value={sortedBlocks.length} />
              <StatItem label="Completed" value={sortedBlocks.filter(b => b.completed).length} color="text-green-400" />
              <StatItem label="Pending" value={sortedBlocks.filter(b => !b.completed).length} color="text-yellow-400" />
              <StatItem label="Total Time" value={formatMinutes(sortedBlocks.reduce((sum, b) => sum + b.duration, 0))} color="text-primary-400" />
            </CardContent>
          </Card>

          <Card>
            <div className="p-4 border-b border-surface-700/50 flex items-center justify-between">
              <h2 className="text-heading-sm font-semibold text-surface-50">Subjects</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/subjects')}>Manage</Button>
            </div>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {subjects.length === 0 ? (
                <p className="text-body-sm text-surface-500 text-center py-4">No subjects yet</p>
              ) : (
                subjects.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-800/50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '20' }}>
                      <span className="font-medium text-sm" style={{ color: s.color }}>{s.name.charAt(0)}</span>
                    </div>
                    <span className="text-body-sm text-surface-300">{s.name}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingBlock ? 'Edit Study Block' : 'Add Study Block'} size="lg">
        <div className="space-y-4">
          <Input
            {...registerForm('title')}
            label="Title"
            placeholder="e.g., Probability Chapter 3"
            error={formData.title?.length === 0 && editingBlock ? 'Required' : undefined}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...registerForm('date')}
              label="Date"
              type="date"
              error={!formData.date ? 'Required' : undefined}
            />
            <Input
              {...registerForm('startTime')}
              label="Start Time"
              type="time"
              error={!formData.startTime ? 'Required' : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              {...registerForm('duration')}
              className="input"
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            >
              {[15, 30, 45, 60, 90, 120, 150, 180].map(m => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>

            <select
              {...registerForm('type')}
              className="input"
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <select
            {...registerForm('subjectId')}
            className="input"
            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value || undefined })}
          >
            <option value="">No subject (General)</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <Input
            {...registerForm('description')}
            label="Description (optional)"
            placeholder="What will you cover in this session?"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={saveBlock} loading={saving}>
              {editingBlock ? 'Save Changes' : 'Add Block'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SortablePlannerBlock({ block, index, onToggle, onEdit, onDelete }: { block: PlannerBlock; index: number; onToggle: (b: PlannerBlock) => void; onEdit: (b: PlannerBlock) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const startTime = format(parseISO(block.startTime), 'h:mm a');
  const endTime = format(new Date(parseISO(block.startTime).getTime() + block.duration * 60000), 'h:mm a');

  return (
    <div ref={setNodeRef} style={style} className={`group relative p-4 hover:bg-surface-800/50 transition-colors ${block.completed ? 'opacity-60 bg-green-500/5' : ''}`}>
      <div {...attributes} {...listeners} className="absolute inset-y-0 left-0 w-8 flex items-center justify-center cursor-grab text-surface-600 hover:text-surface-400">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
      </div>
      <div className="ml-8 flex items-center gap-3">
        <button onClick={() => onToggle(block)} className="flex-shrink-0">
          <input
            type="checkbox"
            checked={block.completed}
            onChange={() => onToggle(block)}
            className="w-5 h-5 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500"
          />
        </button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-surface-50 text-body-xs font-medium" style={{ backgroundColor: block.subject?.color + '20' || '#6366f120' }}>
          {startTime}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium truncate ${block.completed ? 'line-through text-surface-500' : 'text-surface-50'}`}>{block.title}</h4>
            {block.subject && (
              <Badge variant="outline" className="text-xs" style={{ borderColor: block.subject.color, color: block.subject.color }}>
                {block.subject.name}
              </Badge>
            )}
          </div>
          <p className="text-body-xs text-surface-500">{endTime} • {block.duration}min • {block.type}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(block)} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800" aria-label="Edit">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(block.id)} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-800" aria-label="Delete">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color = 'text-surface-50' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-sm text-surface-400">{label}</span>
      <span className={`font-bold text-heading-sm ${color}`}>{value}</span>
    </div>
  );
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function registerForm(field: keyof PlannerBlock) {
  return {
    value: '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {},
    onBlur: () => {}
  };
}