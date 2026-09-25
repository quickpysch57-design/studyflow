import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { period = '30' } = req.query;
  const days = parseInt(period as string);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const [
    sessions,
    tasks,
    subjects,
    streak
  ] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId: req.user!.id, startTime: { gte: startDate } },
      include: { subject: { select: { name: true, color: true } } }
    }),
    prisma.task.findMany({
      where: { userId: req.user!.id, createdAt: { gte: startDate } }
    }),
    prisma.subject.findMany({
      where: { userId: req.user!.id },
      select: { name: true, color: true, studyHours: true, completedChapters: true, totalChapters: true }
    }),
    prisma.streak.findUnique({ where: { userId: req.user!.id } })
  ]);

  const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;
  const weeklyHours = getWeeklyHours(sessions);
  const subjectDistribution = getSubjectDistribution(sessions, subjects);
  const completionTrend = getCompletionTrend(tasks, days);
  const consistency = getConsistency(sessions, days);

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  const mostStudied = subjectDistribution[0]?.name || 'None';
  const leastStudied = subjectDistribution[subjectDistribution.length - 1]?.name || 'None';

  const avgSessionLength = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
    : 0;

  res.json({
    analytics: {
      totalStudyHours: Math.round(totalHours * 10) / 10,
      weeklyHours,
      subjectDistribution,
      completionTrend,
      consistency,
      tasksCompleted: completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      avgSessionLength,
      mostStudiedSubject: mostStudied,
      leastStudiedSubject: leastStudied,
      sessionsCount: sessions.length
    }
  });
}));

function getWeeklyHours(sessions: any[]) {
  const weeks: Record<string, number> = {};
  sessions.forEach(s => {
    const date = new Date(s.startTime);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().split('T')[0];
    weeks[key] = (weeks[key] || 0) + s.duration / 60;
  });
  return Object.entries(weeks).map(([week, hours]) => ({ week, hours: Math.round(hours * 10) / 10 }));
}

function getSubjectDistribution(sessions: any[], subjects: any[]) {
  const subjectHours: Record<string, { hours: number; color: string }> = {};
  sessions.forEach(s => {
    const name = s.subject?.name || 'General';
    subjectHours[name] = {
      hours: (subjectHours[name]?.hours || 0) + s.duration / 60,
      color: s.subject?.color || '#6366f1'
    };
  });
  return Object.entries(subjectHours)
    .map(([name, data]) => ({ name, hours: Math.round(data.hours * 10) / 10, color: data.color }))
    .sort((a, b) => b.hours - a.hours);
}

function getCompletionTrend(tasks: any[], days: number) {
  const trend: Record<string, { completed: number; total: number }> = {};
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().split('T')[0];
    trend[key] = { completed: 0, total: 0 };
  }

  tasks.forEach(t => {
    const created = t.createdAt.toISOString().split('T')[0];
    const completed = t.completedAt ? t.completedAt.toISOString().split('T')[0] : null;
    if (trend[created]) {
      trend[created].total++;
      if (completed && trend[completed]) {
        trend[completed].completed++;
      }
    }
  });

  return Object.entries(trend).map(([date, data]) => ({
    date,
    completed: data.completed,
    total: data.total,
    rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
  }));
}

function getConsistency(sessions: any[], days: number) {
  const studyDays = new Set(
    sessions.map(s => s.startTime.toISOString().split('T')[0])
  );
  const consistency: { date: string; studied: boolean }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    consistency.push({ date: key, studied: studyDays.has(key) });
  }

  return consistency;
}

export default router;