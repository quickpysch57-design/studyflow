import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { q, limit = '20' } = req.query;

  if (!q || (q as string).trim().length < 2) {
    res.json({ results: [] });
    return;
  }

  const query = (q as string).trim();
  const take = parseInt(limit as string);

  const [subjects, chapters, tasks, exams, notes] = await Promise.all([
    prisma.subject.findMany({
      where: { userId: req.user!.id, name: { contains: query, mode: 'insensitive' } },
      take,
      select: { id: true, name: true, color: true }
    }),
    prisma.chapter.findMany({
      where: { userId: req.user!.id, name: { contains: query, mode: 'insensitive' } },
      take,
      include: { subject: { select: { id: true, name: true, color: true } } }
    }),
    prisma.task.findMany({
      where: { userId: req.user!.id, title: { contains: query, mode: 'insensitive' } },
      take,
      include: { subject: { select: { id: true, name: true, color: true } } }
    }),
    prisma.exam.findMany({
      where: { userId: req.user!.id, name: { contains: query, mode: 'insensitive' } },
      take,
      include: { subject: { select: { id: true, name: true, color: true } } }
    }),
    prisma.note.findMany({
      where: {
        userId: req.user!.id,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } }
        ]
      },
      take,
      include: { subject: { select: { id: true, name: true, color: true } } }
    })
  ]);

  const results = [
    ...subjects.map(s => ({ type: 'subject', id: s.id, title: s.name, color: s.color, subtitle: 'Subject' })),
    ...chapters.map(c => ({ type: 'chapter', id: c.id, title: c.name, color: c.subject.color, subtitle: `Chapter • ${c.subject.name}` })),
    ...tasks.map(t => ({ type: 'task', id: t.id, title: t.title, color: t.subject?.color || '#6366f1', subtitle: `Task • ${t.subject?.name || 'General'}` })),
    ...exams.map(e => ({ type: 'exam', id: e.id, title: e.name, color: e.subject.color, subtitle: `Exam • ${e.subject.name}` })),
    ...notes.map(n => ({ type: 'note', id: n.id, title: n.title, color: n.subject?.color || '#6366f1', subtitle: `Note • ${n.subject?.name || 'General'}` }))
  ];

  res.json({ results: results.slice(0, take) });
}));

export default router;