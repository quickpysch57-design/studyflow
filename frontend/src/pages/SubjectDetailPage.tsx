import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge, Progress, Modal, Skeleton, SkeletonCard } from '../components/ui';
import {
  PlusIcon, BookOpenIcon, PencilIcon, TrashIcon, ClockIcon,
  ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, ArrowRightIcon,
  DocumentTextIcon, AcademicCapIcon, SparklesIcon
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
  chapters: Chapter[];
  tasks: Task[];
  exams: Exam[];
  notes: Note[];
  studySessions: Session[];
  progress: number;
}

interface Chapter {
  id: string;
  name: string;
  status: 'NOT_STARTED' | 'LEARNING' | 'PRACTICING' | 'COMPLETED';
  progress: number;
  lastStudiedAt?: string;
  studyTime: number;
  revisionCount: number;
  order: number;
}

interface Task {
  id: string;
  title: string;
  type: string;
  priority: string;
  dueDate?: string;
  completed: boolean;
}

interface Exam {
  id: string;
  name: string;
  date: string;
  preparationPct: number;
}

interface Note {
  id: string;
  title: string;
  updatedAt: string;
  pinned: boolean;
}

interface Session {
  id: string;
  startTime: string;
  duration: number;
  type: string;
}

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started', color: 'text-surface-500' },
  { value: 'LEARNING', label: 'Learning', color: 'text-blue-400' },
  { value: 'PRACTICING', label: 'Practicing', color: 'text-yellow-400' },
  { value: 'COMPLETED', label: 'Completed', color: 'text-green-400' }
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: SparklesIcon },
  { id: 'chapters', label: 'Chapters', icon: BookOpenIcon },
  { id: 'tasks', label: 'Tasks', icon: DocumentTextIcon },
  { id: 'notes', label: 'Notes', icon: DocumentTextIcon },
  { id: 'sessions', label: 'Sessions', icon: ClockIcon }
];

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [chapterModal, setChapterModal] = useState<{ open: boolean; editing?: Chapter }>({ open: false });
  const [chapterForm, setChapterForm] = useState({ name: '', status: 'NOT_STARTED', progress: 0 });

  useEffect(() => {
    if (id) fetchSubject();
  }, [id]);

  const fetchSubject = async () => {
    try {
      const res = await api.get(`/api/subjects/${id}`);
      setSubject(res.data.subject);
    } catch (error) {
      console.error('Failed to fetch subject:', error);
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  };

  const openChapterModal = (chapter?: Chapter) => {
    setChapterForm(chapter ? { name: chapter.name, status: chapter.status, progress: chapter.progress } : { name: '', status: 'NOT_STARTED', progress: 0 });
    setChapterModal({ open: true, editing: chapter });
  };

  const closeChapterModal = () => setChapterModal({ open: false });

  const saveChapter = async () => {
    if (!chapterForm.name.trim()) { toast.error('Chapter name required'); return; }
    try {
      if (chapterModal.editing) {
        await api.patch(`/api/chapters/${chapterModal.editing.id}`, chapterForm);
        toast.success('Chapter updated');
      } else {
        await api.post('/api/chapters', { ...chapterForm, subjectId: id });
        toast.success('Chapter added');
      }
      closeChapterModal();
      fetchSubject();
    } catch (error) { toast.error('Failed to save chapter'); }
  };

  const deleteChapter = async (chapterId: string) => {
    if (!confirm('Delete this chapter?')) return;
    try { await api.delete(`/api/chapters/${chapterId}`); toast.success('Chapter deleted'); fetchSubject(); }
    catch { toast.error('Failed to delete'); }
  };

  const updateChapterStatus = async (chapter: Chapter, newStatus: Chapter['status']) => {
    try {
      await api.patch(`/api/chapters/${chapter.id}`, { status: newStatus });
      fetchSubject();
    } catch { toast.error('Failed to update'); }
  };

  if (loading) {
    return <div className="space-y-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  }

  if (!subject) return null;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/subjects')}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Button>
          <div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: subject.color + '20' }}>
              <span className="text-3xl font-bold" style={{ color: subject.color }}>{subject.name.charAt(0)}</span>
            </div>
          </div>
          <div>
            <h1 className="text-display-sm font-bold text-surface-50">{subject.name}</h1>
            <p className="text-body-sm text-surface-400">{subject.teacher || 'No teacher assigned'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => openChapterModal()}>
            <PlusIcon className="h-5 w-5" /> Add Chapter
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab subject={subject} />}
      {activeTab === 'chapters' && <ChaptersTab subject={subject} onAddChapter={openChapterModal} onEditChapter={openChapterModal} onDeleteChapter={deleteChapter} onUpdateStatus={updateChapterStatus} />}
      {activeTab === 'tasks' && <TasksTab subject={subject} />}
      {activeTab === 'notes' && <NotesTab subject={subject} />}
      {activeTab === 'sessions' && <SessionsTab subject={subject} />}

      <Modal isOpen={chapterModal.open} onClose={closeChapterModal} title={chapterModal.editing ? 'Edit Chapter' : 'Add Chapter'}>
        <div className="space-y-4">
          <Input label="Chapter Name" placeholder="e.g., Probability Distributions" value={chapterForm.name} onChange={e => setChapterForm({...chapterForm, name: e.target.value})} />
          <select className="input" value={chapterForm.status} onChange={e => setChapterForm({...chapterForm, status: e.target.value as any})}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <Input label="Progress %" type="number" min={0} max={100} value={chapterForm.progress} onChange={e => setChapterForm({...chapterForm, progress: parseInt(e.target.value)})} />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50">
            <Button variant="ghost" onClick={closeChapterModal}>Cancel</Button>
            <Button variant="primary" onClick={saveChapter}>{chapterModal.editing ? 'Save' : 'Add'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function OverviewTab({ subject }: { subject: Subject }) {
  const daysLeft = subject.examDate ? differenceInDays(new Date(subject.examDate), new Date()) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <Progress value={subject.progress} size="xl" variant="ring" color={subject.color} showLabel />
              <p className="text-body-lg text-surface-400 mt-4">{subject.completedChapters} of {subject.totalChapters} chapters completed</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Chapters" value={subject.totalChapters} icon={BookOpenIcon} color="text-blue-400" />
              <StatCard label="Completed" value={subject.completedChapters} icon={CheckCircleIcon} color="text-green-400" />
              <StatCard label="Study Hours" value={subject.studyHours.toFixed(1)} icon={ClockIcon} color="text-primary-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Study Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {subject.studySessions.length === 0 ? (
              <p className="text-surface-400 text-center py-8">No study sessions yet</p>
            ) : (
              <div className="space-y-3">
                {subject.studySessions.slice(0, 5).map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-surface-50 text-body-xs font-medium" style={{ backgroundColor: subject.color + '20' }}>
                        {format(new Date(session.startTime), 'h:mm a')}
                      </div>
                      <div>
                        <p className="font-medium text-surface-50">{session.type}</p>
                        <p className="text-body-xs text-surface-500">{session.duration}min • {format(new Date(session.startTime), 'MMM d')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Exam Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subject.examDate ? (
              <>
                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: subject.color + '10', border: `1px solid ${subject.color}30` }}>
                  <p className="text-body-sm text-surface-400">Exam Date</p>
                  <p className="text-heading-lg font-bold text-surface-50 mt-1">{format(new Date(subject.examDate), 'MMMM d, yyyy')}</p>
                  <p className={`text-body-md font-semibold mt-2 ${daysLeft && daysLeft > 0 ? 'text-yellow-400' : daysLeft === 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {daysLeft && daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Exam today!' : 'Exam passed'}
                  </p>
                </div>
                {subject.exams.length > 0 && subject.exams.map(exam => (
                  <div key={exam.id} className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-surface-50">{exam.name}</p>
                        <p className="text-body-xs text-surface-500">Preparation: {exam.preparationPct}%</p>
                      </div>
                      <Progress value={exam.preparationPct} size="sm" variant="gradient" color={subject.color} showLabel />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <AcademicCapIcon className="h-12 w-12 text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400">No exam scheduled</p>
                <Button variant="outline" size="sm" className="mt-3">Add Exam</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ActionButton icon={BookOpenIcon} label="Add Chapter" onClick={() => {}} />
            <ActionButton icon={DocumentTextIcon} label="Add Task" onClick={() => {}} />
            <ActionButton icon={DocumentTextIcon} label="Create Note" onClick={() => {}} />
            <ActionButton icon={ClockIcon} label="Start Focus Session" primary onClick={() => {}} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChaptersTab({ subject, onAddChapter, onEditChapter, onDeleteChapter, onUpdateStatus }: any) {
  const sortedChapters = [...subject.chapters].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="primary" onClick={onAddChapter}><PlusIcon className="h-5 w-5" /> Add Chapter</Button>
        <span className="text-body-sm text-surface-500">{subject.chapters.length} chapters</span>
      </div>
      {sortedChapters.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpenIcon className="h-16 w-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-heading-sm font-semibold text-surface-50 mb-2">No chapters yet</h3>
          <p className="text-surface-400 mb-4">Break down your subject into manageable chapters</p>
          <Button variant="primary" onClick={onAddChapter}><PlusIcon className="h-5 w-5" /> Add First Chapter</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedChapters.map((chapter, index) => (
            <ChapterRow key={chapter.id} chapter={chapter} index={index} onEdit={onEditChapter} onDelete={onDeleteChapter} onUpdateStatus={onUpdateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterRow({ chapter, index, onEdit, onDelete, onUpdateStatus }: any) {
  const statusInfo = STATUS_OPTIONS.find(s => s.value === chapter.status)!;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <span className="w-8 text-center text-surface-500 font-medium">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-surface-50 truncate">{chapter.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="text-xs" style={{ borderColor: statusInfo.color.replace('text-', ''), color: statusInfo.color }}>
              {statusInfo.label}
            </Badge>
            <Progress value={chapter.progress} max={100} size="sm" variant="default" className="w-32" />
            <span className="text-body-xs text-surface-500">{chapter.studyTime}min • {chapter.revisionCount} revisions</span>
          </div>
        </div>
        <select
          value={chapter.status}
          onChange={e => onUpdateStatus(chapter, e.target.value as any)}
          className="input w-auto text-body-sm"
        >
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(chapter)} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800" aria-label="Edit"><PencilIcon className="h-4 w-4" /></button>
          <button onClick={() => onDelete(chapter.id)} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-800" aria-label="Delete"><TrashIcon className="h-4 w-4" /></button>
        </div>
      </div>
    </Card>
  );
}

function TasksTab({ subject }: { subject: Subject }) {
  return (
    <Card>
      <CardContent className="p-6">
        {subject.tasks.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-surface-600 mx-auto mb-4" />
            <h3 className="text-heading-sm font-semibold text-surface-50 mb-2">No tasks</h3>
            <p className="text-surface-400">Tasks for this subject will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subject.tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={task.completed} className="w-5 h-5 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500" />
                  <div>
                    <p className={`font-medium ${task.completed ? 'line-through text-surface-500' : 'text-surface-50'}`}>{task.title}</p>
                    <p className="text-body-xs text-surface-500">{task.type} • {task.priority} priority</p>
                  </div>
                </div>
                {task.dueDate && <Badge variant="outline" className="text-xs">{format(new Date(task.dueDate), 'MMM d')}</Badge>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotesTab({ subject }: { subject: Subject }) {
  return (
    <Card>
      <CardContent className="p-6">
        {subject.notes.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-surface-600 mx-auto mb-4" />
            <h3 className="text-heading-sm font-semibold text-surface-50 mb-2">No notes</h3>
            <p className="text-surface-400">Your notes for this subject will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subject.notes.map(note => (
              <div key={note.id} className={`flex items-start justify-between p-3 rounded-xl border ${note.pinned ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-surface-700/50 bg-surface-800/50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-surface-50 truncate">{note.title}</h4>
                    {note.pinned && <span className="text-yellow-400">📌</span>}
                  </div>
                  <p className="text-body-xs text-surface-500">Updated {format(new Date(note.updatedAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionsTab({ subject }: { subject: Subject }) {
  return (
    <Card>
      <CardContent className="p-6">
        {subject.studySessions.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="h-16 w-16 text-surface-600 mx-auto mb-4" />
            <h3 className="text-heading-sm font-semibold text-surface-50 mb-2">No study sessions</h3>
            <p className="text-surface-400">Your study history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subject.studySessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-surface-50 text-body-xs font-medium" style={{ backgroundColor: subject.color + '20' }}>
                    {format(new Date(session.startTime), 'h:mm a')}
                  </div>
                  <div>
                    <p className="font-medium text-surface-50">{session.type}</p>
                    <p className="text-body-xs text-surface-500">{session.duration}min • {format(new Date(session.startTime), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="text-center p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${color} bg-opacity-10`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-heading-lg font-bold text-surface-50">{value}</p>
      <p className="text-body-xs text-surface-500">{label}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, primary = false, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; primary?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${primary ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30' : 'text-surface-300 hover:bg-surface-800/50'}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium">{label}</span>
    </button>
  );
}