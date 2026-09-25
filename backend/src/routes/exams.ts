import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const createExamSchema = z.object({
  subjectId: z.string(),
  name: z.string().min(1).max(200),
  date: z.string().datetime(),
  syllabus: z.string().optional()
});

const updateExamSchema = createExamSchema.partial();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const exams = await prisma.exam.findMany({
    where: { userId: req.user!.id },
    include: { subject: { select: { id: true, name: true, color: true } } },
    orderBy: { date: 'asc' }
  });

  const now = new Date();
  const examsWithDays = exams.map(exam => {
    const diffTime = exam.date.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { ...exam, daysLeft: Math.max(0, daysLeft) };
  });

  res.json({ exams: examsWithDays });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const data = createExamSchema.parse(req.body);

  const subject = await prisma.subject.findFirst({
    where: { id: data.subjectId, userId: req.user!.id }
  });

  if (!subject) {
    throw new AppError(404, 'Subject not found');
  }

  const exam = await prisma.exam.create({
    data: {
      ...data,
      userId: req.user!.id,
      date: new Date(data.date)
    },
    include: { subject: { select: { id: true, name: true, color: true } } }
  });

  res.status(201).json({ exam });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const exam = await prisma.exam.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      subject: {
        include: {
          chapters: { orderBy: { order: 'asc' } }
        }
      }
    }
  });

  if (!exam) {
    throw new AppError(404, 'Exam not found');
  }

  const now = new Date();
  const daysLeft = Math.ceil((exam.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const chapters = exam.subject.chapters;
  const completed = chapters.filter(c => c.status === 'COMPLETED').length;
  const total = chapters.length;
  const prepPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.json({ exam: { ...exam, daysLeft: Math.max(0, daysLeft), preparationPct: prepPct } });
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const data = updateExamSchema.parse(req.body);

  const exam = await prisma.exam.update({
    where: { id: req.params.id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined
    },
    include: { subject: { select: { id: true, name: true, color: true } } }
  });

  res.json({ exam });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.exam.delete({
    where: { id: req.params.id, userId: req.user!.id }
  });
  res.json({ message: 'Exam deleted' });
}));

export default router;