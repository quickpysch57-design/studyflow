import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, Badge, Progress, Skeleton, SkeletonCard } from '../components/ui';
import {
  ClockIcon, CheckCircleIcon, FireIcon, BookOpenIcon,
  CalendarDaysIcon, FlagIcon, PlayIcon, ArrowRightIcon,
  AcademicCapIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  todayProgress: {
    plannedMinutes: number;
    completedMinutes: number;
    tasksCompleted: number;
    totalTasks: number;
    currentStreak: number;
  };
  todaysPlan: Array<{
    id: string;
    title: string;
    subject: string;
    subjectColor: string;
    startTime: string;
    duration: number;
    type: string;
    completed: boolean;
  }>;
  upcoming: Array<{
    id: string;
    title: string;
    type: 'exam' | 'task';
    subject: string;
    subjectColor: string;
    dueDate: string;
    priority?: string;
  }>;
  subjectHealth: Array<{
    id: string;
    name: string;
    color: string;
    progress: number;
    completedChapters: number;
    totalChapters: number;
  }>;
  insights: string[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessions, tasks, exams, subjects, streak] = await Promise.all([
          api.get('/api/study-sessions', { params: { startDate: new Date().toISOString().split('T')[0] } }),
          api.get('/api/tasks', { params: { filter: 'today' } }),
          api.get('/api/exams'),
          api.get('/api/subjects'),
          api.get('/api/streaks')
        ]);

        const today = new Date();
        const todaySessions = sessions.data.sessions;
        const plannedMinutes = todaySessions.reduce((sum: number, s: any) => sum + s.duration, 0);
        const completedMinutes = todaySessions.filter((s: any) => s.endTime).reduce((sum: number, s: any) => sum + s.duration, 0);

        const todaysTasks = tasks.data.tasks;
        const completedTasks = todaysTasks.filter((t: any) => t.completed).length;

        const upcomingExams = exams.data.exams
          .filter((e: any) => new Date(e.date) >= today)
          .slice(0, 3)
          .map((e: any) => ({
            id: e.id,
            title: e.name,
            type: 'exam' as const,
            subject: e.subject.name,
            subjectColor: e.subject.color,
            dueDate: e.date,
            daysLeft: differenceInDays(new Date(e.date), today)
          }));

        const upcomingTasks = tasks.data.tasks
          .filter((t: any) => !t.completed && t.dueDate && new Date(t.dueDate) >= today)
          .slice(0, 3)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            type: 'task' as const,
            subject: t.subject?.name || 'General',
            subjectColor: t.subject?.color || '#6366f1',
            dueDate: t.dueDate,
            priority: t.priority
          }));

        const studyBlocksResponse = await api.get('/api/study-plans');
        const activePlan = studyBlocksResponse.data.plans.find((p: any) => p.isActive);
        let todaysPlan: any[] = [];
        if (activePlan) {
          const blocksResponse = await api.get(`/api/study-plans/${activePlan.id}/blocks`, {
            params: { date: today.toISOString().split('T')[0] }
          });
          todaysPlan = blocksResponse.data.blocks.map((b: any) => ({
            id: b.id,
            title: b.title,
            subject: b.subject?.name || 'Study',
            subjectColor: b.subject?.color || '#6366f1',
            startTime: b.startTime,
            duration: b.duration,
            type: b.type,
            completed: b.completed
          }));
        }

        const insights = generateInsights(subjects.data.subjects, exams.data.exams, streak.data.streak);

        setData({
          todayProgress: {
            plannedMinutes,
            completedMinutes,
            tasksCompleted: completedTasks,
            totalTasks: todaysTasks.length,
            currentStreak: streak.data.streak.currentStreak
          },
          todaysPlan: todaysPlan.length > 0 ? todaysPlan : generateDefaultPlan(subjects.data.subjects),
          upcoming: [...upcomingExams, ...upcomingTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5),
          subjectHealth: subjects.data.subjects.map((s: any) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            progress: s.chapters.length > 0 ? Math.round((s.chapters.filter((c: any) => c.status === 'COMPLETED').length / s.chapters.length) * 100) : 0,
            completedChapters: s.chapters.filter((c: any) => c.status === 'COMPLETED').length,
            totalChapters: s.chapters.length
          })),
          insights
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in">
        <Skeleton variant="text" width="40%" height="2rem" />
        <Skeleton variant="text" width="60%" height="1rem" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-surface-400">Unable to load dashboard</p>
        <Button variant="primary" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    );
  }

  const progressPercent = data.todayProgress.plannedMinutes > 0
    ? Math.round((data.todayProgress.completedMinutes / data.todayProgress.plannedMinutes) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-surface-50">
            {getGreeting()}, {user?.name || 'Student'}
          </h1>
          <p className="text-body-lg text-surface-400 mt-1">Here's your study flow for today</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => navigate('/focus')} className="w-full sm:w-auto">
          <PlayIcon className="h-5 w-5" />
          Start Focus Session
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClockIcon}
          iconColor="text-primary-400"
          bgColor="bg-primary-500/10"
          label="Planned Study"
          value={formatMinutes(data.todayProgress.plannedMinutes)}
          subtitle={`${progressPercent}% completed`}
        />
        <StatCard
          icon={CheckCircleIcon}
          iconColor="text-green-400"
          bgColor="bg-green-500/10"
          label="Tasks Done"
          value={`${data.todayProgress.tasksCompleted}/${data.todayProgress.totalTasks}`}
          subtitle={data.todayProgress.totalTasks > 0 ? `${Math.round((data.todayProgress.tasksCompleted / data.todayProgress.totalTasks) * 100)}%` : 'No tasks'}
        />
        <StatCard
          icon={FireIcon}
          iconColor="text-orange-400"
          bgColor="bg-orange-500/10"
          label="Current Streak"
          value={`${data.todayProgress.currentStreak} days`}
          subtitle="Keep it going!"
        />
        <StatCard
          icon={FlagIcon}
          iconColor="text-purple-400"
          bgColor="bg-purple-500/10"
          label="Focus Time"
          value={formatMinutes(data.todayProgress.completedMinutes)}
          subtitle={`of ${formatMinutes(data.todayProgress.plannedMinutes)} planned`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-heading-md font-semibold text-surface-50">Today's Plan</h2>
                <p className="text-body-sm text-surface-400">{data.todaysPlan.length} study blocks scheduled</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/planner')}>View All</Button>
            </div>
            <CardContent className="space-y-3">
              {data.todaysPlan.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 text-surface-600 mx-auto mb-3" />
                  <p className="text-surface-400">No study sessions planned</p>
                  <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate('/planner')}>
                    Plan Your Day
                  </Button>
                </div>
              ) : (
                data.todaysPlan.map((block, index) => (
                  <StudyBlockCard key={block.id} block={block} index={index} />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-heading-md font-semibold text-surface-50">Upcoming</h2>
                <p className="text-body-sm text-surface-400">Exams & deadlines</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/exams')}>View All</Button>
            </div>
            <CardContent className="space-y-3">
              {data.upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-green-500/50 mx-auto mb-3" />
                  <p className="text-surface-400">All caught up!</p>
                  <p className="text-body-sm text-surface-500">No upcoming exams or deadlines</p>
                </div>
              ) : (
                data.upcoming.map((item) => (
                  <UpcomingItem key={item.id} item={item} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-md font-semibold text-surface-50">Subject Health</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/subjects')}>View All</Button>
            </div>
            <CardContent className="space-y-4">
              {data.subjectHealth.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpenIcon className="h-12 w-12 text-surface-600 mx-auto mb-3" />
                  <p className="text-surface-400">No subjects yet</p>
                  <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate('/subjects')}>
                    Add Subject
                  </Button>
                </div>
              ) : (
                data.subjectHealth.map(subject => (
                  <SubjectHealthCard key={subject.id} subject={subject} />
                ))
              )}
            </CardContent>
          </Card>

          {data.insights.length > 0 && (
            <Card variant="glass">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="h-5 w-5 text-yellow-400" />
                <h2 className="text-heading-md font-semibold text-surface-50">Smart Insights</h2>
              </div>
              <CardContent className="space-y-3">
                {data.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <span className="text-yellow-400 font-bold">{i + 1}</span>
                    </span>
                    <p className="text-body-sm text-surface-300 pt-0.5">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, bgColor, label, value, subtitle }: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card className="hover:shadow-lg hover:shadow-primary-500/10">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-body-sm text-surface-400">{label}</p>
            <p className="text-heading-lg font-bold text-surface-50 mt-1">{value}</p>
            <p className="text-body-xs text-surface-500 mt-0.5">{subtitle}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudyBlockCard({ block, index }: { block: any; index: number }) {
  const startTime = format(new Date(block.startTime), 'h:mm a');
  const endTime = format(new Date(new Date(block.startTime).getTime() + block.duration * 60000), 'h:mm a');

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl transition-all ${block.completed ? 'bg-green-500/5 border-green-500/10' : 'bg-surface-800/50 border border-surface-700/50 hover:border-primary-500/20'}`}>
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-surface-50 text-body-xs font-medium" style={{ backgroundColor: block.subjectColor + '20' }}>
        <span className="text-surface-50">{startTime}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-surface-50 truncate">{block.title}</h4>
          <Badge variant="outline" className="text-xs" style={{ borderColor: block.subjectColor, color: block.subjectColor }}>
            {block.subject}
          </Badge>
          {block.completed && <CheckCircleIcon className="h-4 w-4 text-green-400" />}
        </div>
        <p className="text-body-xs text-surface-500">{endTime} • {block.duration}min • {block.type}</p>
      </div>
    </div>
  );
}

function UpcomingItem({ item }: { item: any }) {
  const dueDate = new Date(item.dueDate);
  const isToday = dueDate.toDateString() === new Date().toDateString();
  const isTomorrow = dueDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  let timeLabel = format(dueDate, 'MMM d');
  if (isToday) timeLabel = 'Today';
  else if (isTomorrow) timeLabel = 'Tomorrow';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-primary-500/20 transition-colors">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.subjectColor + '20' }}>
        {item.type === 'exam' ? <AcademicCapIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-50 truncate">{item.title}</p>
        <div className="flex items-center gap-2 text-body-xs text-surface-500">
          <Badge variant="outline" className="text-xs" style={{ borderColor: item.subjectColor, color: item.subjectColor }}>
            {item.subject}
          </Badge>
          <span>•</span>
          <span>{timeLabel}</span>
          {item.priority && <Badge variant="outline" className="text-xs">{item.priority}</Badge>}
        </div>
      </div>
      <ArrowRightIcon className="h-5 w-5 text-surface-600" />
    </div>
  );
}

function SubjectHealthCard({ subject }: { subject: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: subject.color + '20' }}>
            <span className="text-surface-50 font-medium text-sm">{subject.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium text-surface-50 text-body-sm">{subject.name}</p>
            <p className="text-body-xs text-surface-500">{subject.completedChapters}/{subject.totalChapters} chapters</p>
          </div>
        </div>
        <span className="font-semibold text-surface-50">{subject.progress}%</span>
      </div>
      <Progress value={subject.progress} size="sm" variant="gradient" color={subject.color} />
    </div>
  );
}

function generateDefaultPlan(subjects: any[]) {
  if (subjects.length === 0) return [];
  const now = new Date();
  const startHour = 17;
  return subjects.slice(0, 3).map((s, i) => ({
    id: `default-${i}`,
    title: 'Study Session',
    subject: s.name,
    subjectColor: s.color,
    startTime: new Date(now.setHours(startHour + i * 1.5, 0, 0, 0)).toISOString(),
    duration: 90,
    type: 'STUDY',
    completed: false
  }));
}

function generateInsights(subjects: any[], exams: any[], streak: any) {
  const insights: string[] = [];

  if (subjects.length > 0) {
    const mostStudied = subjects.reduce((max, s) => s.studyHours > max.studyHours ? s : max, subjects[0]);
    if (mostStudied.studyHours > 0) {
      insights.push(`You've studied ${mostStudied.name} for ${mostStudied.studyHours.toFixed(1)} hours total`);
    }

    const leastProgress = subjects.reduce((min, s) => {
      const pct = s.chapters.length > 0 ? s.chapters.filter((c: any) => c.status === 'COMPLETED').length / s.chapters.length : 1;
      return pct < min.pct ? { pct, name: s.name } : min;
    }, { pct: 1, name: '' });
    if (leastProgress.pct < 0.5 && leastProgress.name) {
      insights.push(`${leastProgress.name} has the lowest completion rate at ${Math.round(leastProgress.pct * 100)}%`);
    }
  }

  const upcomingExams = exams.filter((e: any) => new Date(e.date) > new Date() && differenceInDays(new Date(e.date), new Date()) <= 7);
  if (upcomingExams.length > 0) {
    insights.push(`${upcomingExams.length} exam${upcomingExams.length > 1 ? 's' : ''} within the next 7 days`);
  }

  if (streak.currentStreak > 0) {
    insights.push(`You're on a ${streak.currentStreak}-day study streak!`);
  }

  return insights.slice(0, 3);
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}