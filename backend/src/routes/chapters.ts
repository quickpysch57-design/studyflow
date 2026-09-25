import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const createChapterSchema = z.object({
  subjectId: z.string(),
  name: z.string().min(1).max(200),
  order: z.number().int().optional()
});

const updateChapterSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['NOT_STARTED', 'LEARNING', 'PRACTICING', 'COMPLETED']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  studyTime: z.number().min(0).optional(),
  revisionCount: z.number().int().min(0).optional()
});

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { subjectId } = req.query;

  const chapters = await prisma.chapter.findMany({
    where: {
      userId: req.user!.id,
      ...(subjectId ? { subjectId: subjectId as string } : {})
    },
    include: { subject: { select: { id: true, name: true, color: true } } },
    orderBy: [{ subjectId: 'asc' }, { order: 'asc' }]
  });

  res.json({ chapters });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const data = createChapterSchema.parse(req.body);

  const subject = await prisma.subject.findFirst({
    where: { id: data.subjectId, userId: req.user!.id }
  });

  if (!subject) {
    throw new AppError(404, 'Subject not found');
  }

  const maxOrder = await prisma.chapter.findFirst({
    where: { subjectId: data.subjectId },
    orderBy: { order: 'desc' },
    select: { order: true }
  });

  const chapter = await prisma.chapter.create({
    data: {
      ...data,
      userId: req.user!.id,
      order: data.order ?? (maxOrder?.order ?? 0) + 1
    }
  });

  await updateSubjectProgress(data.subjectId);

  res.status(201).json({ chapter });
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const data = updateChapterSchema.parse(req.body);

  const chapter = await prisma.chapter.findFirst({
    where: { id: req.params.id, userId: req.user!.id }
  });

  if (!chapter) {
    throw new AppError(404, 'Chapter not found');
  }

  const updateData: any = { ...data };
  if (data.status === 'COMPLETED' && chapter.status !== 'COMPLETED') {
    updateData.lastStudiedAt = new Date();
    updateData.progress = 100;
  } else if (data.status && data.status !== 'COMPLETED' && chapter.status === 'COMPLETED') {
    updateData.progress = Math.min(data.progress ?? chapter.progress, 99);
  }

  const updated = await prisma.chapter.update({
    where: { id: req.params.id },
    data: updateData
  });

  await updateSubjectProgress(chapter.subjectId);

  res.json({ chapter: updated });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const chapter = await prisma.chapter.findFirst({
    where: { id: req.params.id, userId: req.user!.id }
  });

  if (!chapter) {
    throw new AppError(404, 'Chapter not found');
  }

  await prisma.chapter.delete({ where: { id: req.params.id } });
  await updateSubjectProgress(chapter.subjectId);

  res.json({ message: 'Chapter deleted' });
}));

async function updateSubjectProgress(subjectId: string) {
  const chapters = await prisma.chapter.findMany({
    where: { subjectId },
    select: { status: true }
  });

  const total = chapters.length;
  const completed = chapters.filter(c => c.status === 'COMPLETED').length;

  await prisma.subject.update({
    where: { id: subjectId },
    data: {
      totalChapters: total,
      completedChapters: completed
    }
  });
}

export default router;