import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { start, end } = req.query;

  const startDate = start ? new Date(start as string) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = end ? new Date(end as string) : new Date();
  endDate.setDate(endDate.getDate() + 30);
  endDate.setHours(23, 59, 59, 999);

  const [exams, tasks, studyBlocks, sessions] = await Promise.all([
    prisma.exam.findMany({
      where: { userId: req.user!.id, date: { gte: startDate, lte: endDate } },
      include: { subject: { select: { name: true, color: true } } }
    }),
    prisma.task.findMany({
      where: { userId: req.user!.id, dueDate: { gte: startDate, lte: endDate } },
      include: { subject: { select: { name: true, color: true } } }
    }),
    prisma.studyBlock.findMany({
      where: { userId: req.user!.id, date: { gte: startDate, lte: endDate } },
      include: { subject: { select: { name: true, color: true } } }
    }),
    prisma.studySession.findMany({
      where: { userId: req.user!.id, startTime: { gte: startDate, lte: endDate } },
      include: { subject: { select: { name: true, color: true } } }
    })
  ]);

  const events = [
    ...exams.map(e => ({
      id: e.id,
      type: 'exam',
      title: e.name,
      subject: e.subject.name,
      subjectColor: e.subject.color,
      date: e.date.toISOString(),
      allDay: true
    })),
    ...tasks.map(t => ({
      id: t.id,
      type: 'task',
      title: t.title,
      subject: t.subject?.name,
      subjectColor: t.subject?.color,
      date: t.dueDate?.toISOString(),
      startTime: t.startTime?.toISOString(),
      duration: t.duration,
      priority: t.priority,
      completed: t.completed
    })),
    ...studyBlocks.map(b => ({
      id: b.id,
      type: 'study-block',
      title: b.title,
      subject: b.subject?.name,
      subjectColor: b.subject?.color,
      date: b.date.toISOString(),
      startTime: b.startTime.toISOString(),
      duration: b.duration,
      completed: b.completed
    })),
    ...sessions.map(s => ({
      id: s.id,
      type: 'session',
      title: s.subject?.name || 'Study Session',
      subject: s.subject?.name,
      subjectColor: s.subject?.color,
      date: s.startTime.toISOString(),
      startTime: s.startTime.toISOString(),
      duration: s.duration,
      sessionType: s.type
    }))
  ];

  res.json({ events });
}));

export default router;