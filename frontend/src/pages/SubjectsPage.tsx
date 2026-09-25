import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, Input, Badge, Modal, Skeleton, SkeletonCard } from '../components/ui';
import {
  PlusIcon, BookOpenIcon, PencilIcon, TrashIcon, CalculatorIcon,
  SparklesIcon, ChartBarIcon, ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';

interface Subject {
  id: string;
  name: string;
  color: string;
  icon?: string;
  teacher?: string;
  totalChapters: number;
  completedChapters: number;
  studyHours: number;
  examDate?: string;
  chapters?: any[];
  _count?: { chapters: number; tasks: number; exams: number; notes: number };
  progress?: number;
}

export function SubjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#6366f1',
    icon: '',
    teacher: '',
    examDate: ''
  });

  const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#22c55e',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#14b8a6'
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/api/subjects');
      setSubjects(res.data.subjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (subject?: Subject) => {
    setEditingSubject(subject || null);
    setFormData(subject ? {
      name: subject.name,
      color: subject.color,
      icon: subject.icon || '',
      teacher: subject.teacher || '',
      examDate: subject.examDate ? subject.examDate.split('T')[0] : ''
    } : {
      name: '',
      color: '#6366f1',
      icon: '',
      teacher: '',
      examDate: ''
    });
    setModalOpen(true);
  };

  const saveSubject = async () => {
    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      const data = {
        ...formData,
        examDate: formData.examDate || undefined
      };

      if (editingSubject) {
        await api.patch(`/api/subjects/${editingSubject.id}`, data);
        toast.success('Subject updated');
      } else {
        await api.post('/api/subjects', data);
        toast.success('Subject added');
      }
      closeModal();
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to save subject');
    }
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Delete this subject? This will also delete all its chapters, tasks, and notes.')) return;
    try {
      await api.delete(`/api/subjects/${id}`);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSubject(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="40%" height="2rem" />
          <Skeleton variant="text" width="20%" height="2rem" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-surface-50">Subjects</h1>
          <p className="text-body-lg text-surface-400 mt-1">Manage your subjects and track progress</p>
        </div>
        <Button variant="primary" onClick={() => openModal()}>
          <PlusIcon className="h-5 w-5" />
          Add Subject
        </Button>
      </div>

      {subjects.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="h-10 w-10 text-primary-400" />
          </div>
          <h3 className="text-heading-md font-semibold text-surface-50 mb-2">No subjects yet</h3>
          <p className="text-surface-400 mb-6">Add your first subject to start tracking your progress</p>
          <Button variant="primary" onClick={() => openModal()}>
            <PlusIcon className="h-5 w-5" />
            Add Subject
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => (
            <SubjectCard key={subject.id} subject={subject} onClick={() => navigate(`/subjects/${subject.id}`)} onEdit={openModal} onDelete={deleteSubject} />
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingSubject ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g., Mathematics"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!formData.name && editingSubject ? 'Required' : undefined}
          />

          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${formData.color === color ? 'border-primary-500 scale-110' : 'border-transparent hover:border-surface-500'}`}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                  aria-pressed={formData.color === color}
                />
              ))}
            </div>
          </div>

          <Input
            label="Teacher (optional)"
            placeholder="e.g., Mr. Sharma"
            value={formData.teacher}
            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
          />

          <Input
            label="Exam Date (optional)"
            type="date"
            value={formData.examDate}
            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={saveSubject}>
              {editingSubject ? 'Save Changes' : 'Add Subject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SubjectCard({ subject, onClick, onEdit, onDelete }: { subject: Subject; onClick: () => void; onEdit: (s: Subject) => void; onDelete: (id: string) => void }) {
  return (
    <Card variant="hover" className="cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: subject.color + '20' }}>
            <span className="text-2xl font-bold" style={{ color: subject.color }}>{subject.name.charAt(0)}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(subject); }} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800" aria-label="Edit">
              <PencilIcon className="h-4 w-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(subject.id); }} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-800" aria-label="Delete">
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h3 className="text-heading-md font-semibold text-surface-50 mb-2">{subject.name}</h3>
        {subject.teacher && <p className="text-body-sm text-surface-400 mb-3">{subject.teacher}</p>}

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-surface-400">Progress</span>
            <span className="font-semibold text-surface-50">{subject.progress || 0}%</span>
          </div>
          <Progress value={subject.progress || 0} size="sm" variant="gradient" color={subject.color} />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-surface-700/50">
          <div className="text-center">
            <p className="text-heading-sm font-bold text-surface-50">{subject.totalChapters}</p>
            <p className="text-body-xs text-surface-500">Chapters</p>
          </div>
          <div className="text-center">
            <p className="text-heading-sm font-bold text-surface-50">{subject.studyHours.toFixed(1)}h</p>
            <p className="text-body-xs text-surface-500">Studied</p>
          </div>
          <div className="text-center">
            <p className="text-heading-sm font-bold text-surface-50">{subject.completedChapters}</p>
            <p className="text-body-xs text-surface-500">Completed</p>
          </div>
        </div>

        {subject.examDate && (
          <div className="mt-4 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
            <div className="flex items-center gap-2 text-body-sm">
              <span className="text-surface-400">Exam:</span>
              <span className="font-medium text-surface-50">{format(new Date(subject.examDate), 'MMM d, yyyy')}</span>
              <span className="text-surface-500">({differenceInDays(new Date(subject.examDate), new Date())} days)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function format(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function differenceInDays(date1: Date, date2: Date) {
  const diff = date1.getTime() - date2.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}