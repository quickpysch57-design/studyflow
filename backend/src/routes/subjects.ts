import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
  teacher: z.string().optional(),
  examDate: z.string().datetime().optional()
});

const updateSubjectSchema = createSubjectSchema.partial();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const subjects = await prisma.subject.findMany({
    where: { userId: req.user!.id },
    include: {
      _count: { select: { chapters: true, tasks: true, exams: true, notes: true } },
      chapters: {
        select: { status: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const subjectsWithProgress = subjects.map(s => {
    const completed = s.chapters.filter(c => c.status === 'COMPLETED').length;
    const total = s.chapters.length;
    return {
      ...s,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      chapters: undefined
    };
  });

  res.json({ subjects: subjectsWithProgress });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const data = createSubjectSchema.parse(req.body);

  const subject = await prisma.subject.create({
    data: {
      ...data,
      userId: req.user!.id,
      examDate: data.examDate ? new Date(data.examDate) : null
    }
  });

  res.status(201).json({ subject });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const subject = await prisma.subject.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      chapters: { orderBy: { order: 'asc' } },
      tasks: { where: { completed: false }, orderBy: { dueDate: 'asc' } },
      exams: { orderBy: { date: 'asc' } },
      notes: { orderBy: { updatedAt: 'desc' } },
      studySessions: { orderBy: { startTime: 'desc' }, take: 10 }
    }
  });

  if (!subject) {
    throw new AppError(404, 'Subject not found');
  }

  const completedChapters = subject.chapters.filter(c => c.status === 'COMPLETED').length;
  const progress = subject.chapters.length > 0
    ? Math.round((completedChapters / subject.chapters.length) * 100)
    : 0;

  res.json({ subject: { ...subject, progress } });
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const data = updateSubjectSchema.parse(req.body);

  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: {
      ...data,
      examDate: data.examDate ? new Date(data.examDate) : undefined
    }
  });

  res.json({ subject });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.subject.delete({
    where: { id: req.params.id, userId: req.user!.id }
  });
  res.json({ message: 'Subject deleted' });
}));

export default router;