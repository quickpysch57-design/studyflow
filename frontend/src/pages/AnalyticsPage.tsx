import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress, Skeleton, SkeletonCard } from '../components/ui';
import {
  ClockIcon, BookOpenIcon, ChartBarIcon, ChartBarIcon,
  FireIcon, FlagIcon, CalendarDaysIcon, ArrowUpIcon, ArrowDownIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { toast } from '../components/ui/Toast';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/analytics', { params: { period } });
      setAnalytics(res.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in">
        <Skeleton variant="text" width="40%" height="2rem" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-surface-50">Analytics</h1>
          <p className="text-body-lg text-surface-400 mt-1">Track your study progress and patterns</p>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-2 rounded-xl text-body-sm font-medium transition-all ${
                period === p
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClockIcon}
          iconColor="text-primary-400"
          bgColor="bg-primary-500/10"
          label="Total Study Time"
          value={analytics.totalStudyHours.toFixed(1)}h
          subtitle={`${analytics.weeklyHours.slice(-1)[0]?.hours || 0}h this week`}
        />
        <StatCard
          icon={FlagIcon}
          iconColor="text-green-400"
          bgColor="bg-green-500/10"
          label="Tasks Completed"
          value={`${analytics.tasksCompleted}/${analytics.totalTasks}`}
          subtitle={`${analytics.completionRate}% completion rate`}
        />
        <StatCard
          icon={FireIcon}
          iconColor="text-orange-400"
          bgColor="bg-orange-500/10"
          label="Current Streak"
          value={`${analytics.currentStreak} days`}
          subtitle={`Best: ${analytics.longestStreak} days`}
        />
        <StatCard
          icon={ClockIcon}
          iconColor="text-purple-400"
          bgColor="bg-purple-500/10"
          label="Avg Session"
          value={`${analytics.avgSessionLength}min`}
          subtitle={`${analytics.sessionsCount} sessions total`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Study Hours</CardTitle>
              <Badge variant="outline">Last {period} days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.weeklyHours}>
                <defs>
                  <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={12} tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" fontSize={12} tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                />
                <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorWeekly)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.subjectDistribution.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="hours"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analytics.subjectDistribution.slice(0, 6).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.completionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tick={{ fill: '#94a3b8' }} interval="preserveStartEnd" />
                <YAxis stroke="#64748b" fontSize={12} tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                />
                <Legend />
                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={false} name="Completion %" />
                <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} dot={false} name="Completed" yAxisId="right" />
                <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={false} name="Total" yAxisId="right" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1 justify-center">
                {analytics.consistency.slice(-28).map((day: any, index: number) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      day.studied ? 'bg-green-500/80' : 'bg-surface-800 border border-surface-700'
                    }`}
                    title={`${day.date}: ${day.studied ? 'Studied' : 'No study'}`}
                  >
                    {day.studied && <CheckCircleIcon className="h-4 w-4 text-white" />}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 text-body-sm text-surface-500">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500/80" /><span>Studied</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-surface-800 border border-surface-700" /><span>Missed</span></div>
              </div>
              <p className="text-center text-body-sm text-surface-400">Last 28 days - Tap a day for details</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subject Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.subjectDistribution.map((subject: any, index: number) => (
              <div key={subject.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (subject.color || COLORS[index % COLORS.length]) + '20' }}>
                      <span className="font-medium text-sm" style={{ color: subject.color || COLORS[index % COLORS.length] }}>{subject.name.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-surface-50">{subject.name}</span>
                  </div>
                  <span className="font-bold text-surface-50">{subject.hours.toFixed(1)}h</span>
                </div>
                <Progress value={Math.round((subject.hours / (analytics.weeklyHours.reduce((sum: number, w: any) => sum + w.hours, 0) || 1)) * 100)} size="sm" variant="gradient" color={subject.color || COLORS[index % COLORS.length]} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow label="Most Studied" value={analytics.mostStudiedSubject} icon={ChartBarIcon} color="text-green-400" />
            <MetricRow label="Least Studied" value={analytics.leastStudiedSubject} icon={ChartBarIcon} color="text-red-400" />
            <MetricRow label="Weekly Average" value={`${(analytics.weeklyHours.reduce((sum: number, w: any) => sum + w.hours, 0) / (analytics.weeklyHours.length || 1)).toFixed(1)}h`} icon={ClockIcon} color="text-primary-400" />
            <MetricRow label="Best Week" value={`${Math.max(...analytics.weeklyHours.map((w: any) => w.hours)).toFixed(1)}h`} icon={FireIcon} color="text-orange-400" />
            <MetricRow label="Sessions This Period" value={analytics.sessionsCount} icon={FlagIcon} color="text-purple-400" />
            <MetricRow label="Tasks Pending" value={analytics.totalTasks - analytics.tasksCompleted} icon={ClockIcon} color="text-yellow-400" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InsightCard icon={FireIcon} color="text-orange-400" title="Streak" description={`${analytics.currentStreak} day streak ${analytics.currentStreak > 0 ? '🔥' : '—'}`} />
            <InsightCard icon={FlagIcon} color="text-primary-400" title="Completion" description={`${analytics.completionRate}% task completion rate`} />
            <InsightCard icon={BookOpenIcon} color="text-blue-400" title="Focus" description={`${analytics.subjectDistribution.length} active subjects`} />
            <InsightCard icon={ChartBarIcon} color="text-green-400" title="Progress" description={`${analytics.tasksCompleted} tasks completed this period`} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, bgColor, label, value, subtitle }: any) {
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

function MetricRow({ label, value, icon: Icon, color }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-body-sm text-surface-400">{label}</span>
      </div>
      <span className="font-semibold text-surface-50">{value}</span>
    </div>
  );
}

function InsightCard({ icon: Icon, color, title, description }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium text-surface-50">{title}</p>
        <p className="text-body-sm text-surface-400">{description}</p>
      </div>
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}