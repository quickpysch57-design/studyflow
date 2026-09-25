import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const createSessionSchema = z.object({
  subjectId: z.string().optional(),
  chapterId: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().int().min(1).max(480),
  type: z.enum(['FOCUS', 'POMODORO', 'STUDY', 'REVISION', 'PRACTICE']).optional(),
  notes: z.string().optional()
});

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { startDate, endDate, subjectId } = req.query;

  let where: any = { userId: req.user!.id };

  if (subjectId) where.subjectId = subjectId;

  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate as string);
    if (endDate) where.startTime.lte = new Date(endDate as string);
  }

  const sessions = await prisma.studySession.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, color: true } },
      chapter: { select: { id: true, name: true } }
    },
    orderBy: { startTime: 'desc' }
  });

  res.json({ sessions });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const data = createSessionSchema.parse(req.body);

  if (data.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, userId: req.user!.id }
    });
    if (!subject) throw new AppError(404, 'Subject not found');
  }

  if (data.chapterId) {
    const chapter = await prisma.chapter.findFirst({
      where: { id: data.chapterId, userId: req.user!.id }
    });
    if (!chapter) throw new AppError(404, 'Chapter not found');
  }

  const session = await prisma.studySession.create({
    data: {
      ...data,
      userId: req.user!.id,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : new Date(new Date(data.startTime).getTime() + data.duration * 60000)
    },
    include: {
      subject: { select: { id: true, name: true, color: true } },
      chapter: { select: { id: true, name: true } }
    }
  });

  if (data.subjectId) {
    await prisma.subject.update({
      where: { id: data.subjectId },
      data: { studyHours: { increment: data.duration / 60 } }
    });
  }

  if (data.chapterId) {
    await prisma.chapter.update({
      where: { id: data.chapterId },
      data: { studyTime: { increment: data.duration }, lastStudiedAt: new Date() }
    });
  }

  res.status(201).json({ session });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.studySession.delete({
    where: { id: req.params.id, userId: req.user!.id }
  });
  res.json({ message: 'Session deleted' });
}));

export default router;