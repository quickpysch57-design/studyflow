import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const createPlanSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  examDate: z.string().datetime().optional(),
  generatedBy: z.string().optional(),
  planData: z.any()
});

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const plans = await prisma.studyPlan.findMany({
    where: { userId: req.user!.id },
    include: {
      blocks: {
        include: { subject: { select: { id: true, name: true, color: true } } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ plans });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const data = createPlanSchema.parse(req.body);

  const plan = await prisma.studyPlan.create({
    data: {
      ...data,
      userId: req.user!.id,
      examDate: data.examDate ? new Date(data.examDate) : null
    }
  });

  res.status(201).json({ plan });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const plan = await prisma.studyPlan.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      blocks: {
        include: { subject: { select: { id: true, name: true, color: true } } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      }
    }
  });

  if (!plan) {
    throw new AppError(404, 'Study plan not found');
  }

  res.json({ plan });
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const plan = await prisma.studyPlan.update({
    where: { id: req.params.id, userId: req.user!.id },
    data: req.body
  });

  res.json({ plan });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.studyPlan.delete({
    where: { id: req.params.id, userId: req.user!.id }
  });
  res.json({ message: 'Study plan deleted' });
}));

router.get('/:id/blocks', asyncHandler(async (req: AuthRequest, res) => {
  const { date } = req.query;

  let where: any = { planId: req.params.id };
  if (date) {
    const start = new Date(date as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  const blocks = await prisma.studyBlock.findMany({
    where,
    include: { subject: { select: { id: true, name: true, color: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
  });

  res.json({ blocks });
}));

router.post('/:id/blocks', asyncHandler(async (req: AuthRequest, res) => {
  const blockSchema = z.object({
    subjectId: z.string().optional(),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    date: z.string().datetime(),
    startTime: z.string().datetime(),
    duration: z.number().int().min(1).max(480),
    type: z.enum(['STUDY', 'REVISION', 'PRACTICE', 'BREAK', 'EXAM_PREP', 'ASSIGNMENT']).optional(),
    order: z.number().int().optional()
  });

  const data = blockSchema.parse(req.body);

  const plan = await prisma.studyPlan.findFirst({
    where: { id: req.params.id, userId: req.user!.id }
  });
  if (!plan) throw new AppError(404, 'Study plan not found');

  const block = await prisma.studyBlock.create({
    data: {
      ...data,
      planId: req.params.id,
      userId: req.user!.id,
      date: new Date(data.date),
      startTime: new Date(data.startTime)
    },
    include: { subject: { select: { id: true, name: true, color: true } } }
  });

  res.status(201).json({ block });
}));

router.patch('/blocks/:blockId', asyncHandler(async (req: AuthRequest, res) => {
  const blockSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    date: z.string().datetime().optional(),
    startTime: z.string().datetime().optional(),
    duration: z.number().int().min(1).max(480).optional(),
    type: z.enum(['STUDY', 'REVISION', 'PRACTICE', 'BREAK', 'EXAM_PREP', 'ASSIGNMENT']).optional(),
    completed: z.boolean().optional(),
    order: z.number().int().optional()
  });

  const data = blockSchema.parse(req.body);

  const updateData: any = { ...data };
  if (data.date) updateData.date = new Date(data.date);
  if (data.startTime) updateData.startTime = new Date(data.startTime);
  if (data.completed === true) updateData.completedAt = new Date();
  else if (data.completed === false) updateData.completedAt = null;

  const block = await prisma.studyBlock.update({
    where: { id: req.params.blockId },
    data: updateData,
    include: { subject: { select: { id: true, name: true, color: true } } }
  });

  res.json({ block });
}));

router.delete('/blocks/:blockId', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.studyBlock.delete({ where: { id: req.params.blockId } });
  res.json({ message: 'Block deleted' });
}));

export default router;