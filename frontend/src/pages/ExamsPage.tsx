import { useState, useEffect } from 'react';
import { format, differenceInDays, isToday } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge, Progress, Modal, Skeleton, SkeletonCard } from '../components/ui';
import {
  PlusIcon, AcademicCapIcon, PencilIcon, TrashIcon, CalendarDaysIcon,
  ClockIcon, BookOpenIcon, CheckCircleIcon, ArrowRightIcon, SparklesIcon
} from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';

interface Exam {
  id: string;
  name: string;
  date: string;
  preparationPct: number;
  syllabus?: string;
  subject: { id: string; name: string; color: string };
  daysLeft: number;
  chapters?: any[];
}

interface Subject { id: string; name: string; color: string; }

export function ExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subjectId: '',
    date: format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'),
    syllabus: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        api.get('/api/exams'),
        api.get('/api/subjects')
      ]);
      setExams(examsRes.data.exams);
      setSubjects(subjectsRes.data.subjects);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (exam?: Exam) => {
    setEditingExam(exam || null);
    setFormData(exam ? {
      name: exam.name,
      subjectId: exam.subject.id,
      date: exam.date.split('T')[0],
      syllabus: exam.syllabus || ''
    } : {
      name: '',
      subjectId: '',
      date: format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'),
      syllabus: ''
    });
    setModalOpen(true);
  };

  const viewExam = async (exam: Exam) => {
    try {
      const res = await api.get(`/api/exams/${exam.id}`);
      setViewingExam(res.data.exam);
    } catch { toast.error('Failed to load exam details'); }
  };

  const saveExam = async () => {
    if (!formData.name.trim() || !formData.subjectId) { toast.error('Name and subject required'); return; }
    try {
      const data = { ...formData, date: new Date(formData.date).toISOString() };
      if (editingExam) {
        await api.patch(`/api/exams/${editingExam.id}`, data);
        toast.success('Exam updated');
      } else {
        await api.post('/api/exams', data);
        toast.success('Exam added');
      }
      closeModal();
      fetchData();
    } catch { toast.error('Failed to save exam'); }
  };

  const deleteExam = async (id: string) => {
    if (!confirm('Delete this exam?')) return;
    try { await api.delete(`/api/exams/${id}`); toast.success('Exam deleted'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  const closeModal = () => { setModalOpen(false); setEditingExam(null); };

  const upcomingExams = exams.filter(e => e.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft);
  const pastExams = exams.filter(e => e.daysLeft < 0).sort((a, b) => b.daysLeft - a.daysLeft);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton variant="text" width="40%" height="2rem" /><Skeleton variant="text" width="20%" height="2rem" /></div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-surface-50">Exam Center</h1>
          <p className="text-body-lg text-surface-400 mt-1">Track your exams and preparation progress</p>
        </div>
        <Button variant="primary" onClick={() => openModal()}><PlusIcon className="h-5 w-5" /> Add Exam</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ExamStatCard label="Total Exams" value={exams.length} icon={AcademicCapIcon} color="text-purple-400" />
        <ExamStatCard label="Upcoming" value={upcomingExams.length} icon={CalendarDaysIcon} color="text-blue-400" />
        <ExamStatCard label="This Week" value={upcomingExams.filter(e => e.daysLeft <= 7).length} icon={ClockIcon} color="text-yellow-400" />
        <ExamStatCard label="Past" value={pastExams.length} icon={CheckCircleIcon} color="text-green-400" />
      </div>

      {upcomingExams.length === 0 && pastExams.length === 0 ? (
        <Card className="text-center py-16">
          <AcademicCapIcon className="h-16 w-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-heading-md font-semibold text-surface-50 mb-2">No exams yet</h3>
          <p className="text-surface-400 mb-6">Add your first exam to start tracking preparation</p>
          <Button variant="primary" onClick={() => openModal()}><PlusIcon className="h-5 w-5" /> Add Exam</Button>
        </Card>
      ) : (
        <>
          {upcomingExams.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-heading-lg font-semibold text-surface-50">Upcoming Exams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingExams.map(exam => (
                  <ExamCard key={exam.id} exam={exam} onClick={() => viewExam(exam)} onEdit={openModal} onDelete={deleteExam} />
                ))}
              </div>
            </section>
          )}

          {pastExams.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-heading-lg font-semibold text-surface-50">Past Exams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastExams.map(exam => (
                  <ExamCard key={exam.id} exam={exam} onClick={() => viewExam(exam)} onEdit={openModal} onDelete={deleteExam} past />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingExam ? 'Edit Exam' : 'Add Exam'} size="lg">
        <div className="space-y-4">
          <Input label="Exam Name" placeholder="e.g., Mathematics Final" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} error={!formData.name && editingExam ? 'Required' : undefined} />
          <select className="input" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} required>
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Input label="Exam Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          <Input label="Syllabus (optional)" placeholder="Topics covered, chapters, etc." value={formData.syllabus} onChange={e => setFormData({...formData, syllabus: e.target.value})} />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={saveExam}>{editingExam ? 'Save Changes' : 'Add Exam'}</Button>
          </div>
        </div>
      </Modal>

      {viewingExam && (
        <ExamDetailModal exam={viewingExam} onClose={() => setViewingExam(null)} />
      )}
    </div>
  );
}

function ExamCard({ exam, onClick, onEdit, onDelete, past = false }: { exam: Exam; onClick: () => void; onEdit: (e: Exam) => void; onDelete: (id: string) => void; past?: boolean }) {
  const isToday = exam.daysLeft === 0;
  const isTomorrow = exam.daysLeft === 1;

  return (
    <Card variant="hover" className={`cursor-pointer ${past ? 'opacity-70' : ''} ${isToday && !past ? 'ring-2 ring-red-500/50' : ''}`} onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: exam.subject.color + '20' }}>
            <AcademicCapIcon className="h-6 w-6" style={{ color: exam.subject.color }} />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); onEdit(exam); }} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800" aria-label="Edit"><PencilIcon className="h-4 w-4" /></button>
            <button onClick={e => { e.stopPropagation(); onDelete(exam.id); }} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-800" aria-label="Delete"><TrashIcon className="h-4 w-4" /></button>
          </div>
        </div>

        <h3 className="text-heading-md font-semibold text-surface-50 mb-1">{exam.name}</h3>
        <p className="text-body-sm text-surface-400 mb-3">{exam.subject.name}</p>

        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" style={{ borderColor: exam.subject.color, color: exam.subject.color }}>
            {exam.subject.name}
          </Badge>
          <div className="text-right">
            <p className={`font-bold text-heading-sm ${isToday && !past ? 'text-red-400' : past ? 'text-surface-500' : exam.daysLeft <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
              {past ? 'Completed' : isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : `${exam.daysLeft} days`}
            </p>
            <p className="text-body-xs text-surface-500">{format(new Date(exam.date), 'MMM d, yyyy')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-surface-400">Preparation</span>
            <span className="font-semibold text-surface-50">{exam.preparationPct}%</span>
          </div>
          <Progress value={exam.preparationPct} size="sm" variant="gradient" color={exam.subject.color} />
        </div>

        {exam.syllabus && (
          <p className="text-body-xs text-surface-500 mt-2 line-clamp-2">{exam.syllabus}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ExamDetailModal({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const completedChapters = exam.chapters?.filter((c: any) => c.status === 'COMPLETED').length || 0;
  const totalChapters = exam.chapters?.length || 0;

  return (
    <Modal isOpen={true} onClose={onClose} title={exam.name} size="xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: exam.subject.color + '10', border: `1px solid ${exam.subject.color}30` }}>
          <div>
            <p className="text-body-sm text-surface-400">Exam Date</p>
            <p className="text-heading-lg font-bold text-surface-50">{format(new Date(exam.date), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="text-right">
            <p className={`font-bold text-heading-sm ${exam.daysLeft >= 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {exam.daysLeft >= 0 ? `${exam.daysLeft} days left` : 'Completed'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Syllabus Coverage</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <Progress value={exam.preparationPct} size="xl" variant="ring" color={exam.subject.color} showLabel />
                <p className="text-body-sm text-surface-400 mt-3">{completedChapters} of {totalChapters} chapters completed</p>
              </div>
              {exam.syllabus && (
                <div>
                  <h4 className="text-body-sm font-medium text-surface-400 mb-2">Syllabus</h4>
                  <p className="text-body-sm text-surface-300">{exam.syllabus}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Chapters Progress</CardTitle></CardHeader>
            <CardContent>
              {exam.chapters && exam.chapters.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {exam.chapters.map((chapter: any) => (
                    <div key={chapter.id} className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-surface-50 truncate">{chapter.name}</h4>
                        <Badge variant="outline" className="text-xs" style={{ borderColor: getStatusColor(chapter.status), color: getStatusColor(chapter.status) }}>
                          {chapter.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Progress value={chapter.progress} size="sm" variant="gradient" color={exam.subject.color} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-surface-400 text-center py-8">No chapter data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50">
          <Button variant="primary" onClick={onClose}><CheckCircleIcon className="h-5 w-5" /> Close</Button>
        </div>
      </div>
    </Modal>
  );
}

function ExamStatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-sm text-surface-400">{label}</p>
            <p className="text-heading-xl font-bold text-surface-50 mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NOT_STARTED: '#64748b',
    LEARNING: '#3b82f6',
    PRACTICING: '#f59e0b',
    COMPLETED: '#22c55e'
  };
  return colors[status] || '#64748b';
}