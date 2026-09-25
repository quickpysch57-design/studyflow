import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const createTaskSchema = z.object({
  subjectId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['HOMEWORK', 'ASSIGNMENT', 'PROJECT', 'REVISION', 'EXAM_PREPARATION', 'PERSONAL', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
  startTime: z.string().datetime().optional(),
  duration: z.number().int().min(1).max(480).optional()
});

const updateTaskSchema = createTaskSchema.partial().extend({
  completed: z.boolean().optional()
});

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { filter, subjectId, search } = req.query;

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let where: any = { userId: req.user!.id };

  if (subjectId) where.subjectId = subjectId;

  if (filter) {
    switch (filter) {
      case 'today':
        where.dueDate = { gte: todayStart, lte: todayEnd };
        break;
      case 'tomorrow': {
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);
        where.dueDate = { gte: tomorrowStart, lte: tomorrowEnd };
        break;
      }
      case 'this-week':
        where.dueDate = { gte: todayStart, lte: weekEnd };
        break;
      case 'overdue':
        where.dueDate = { lt: todayStart };
        where.completed = false;
        break;
      case 'completed':
        where.completed = true;
        break;
    }
  }

  if (search) {
    where.title = { contains: search as string, mode: 'insensitive' };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { subject: { select: { id: true, name: true, color: true } } },
    orderBy: [
      { completed: 'asc' },
      { priority: 'desc' },
      { dueDate: 'asc' }
    ]
  });

  res.json({ tasks });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const data = createTaskSchema.parse(req.body);

  const task = await prisma.task.create({
    data: {
      ...data,
      userId: req.user!.id,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      startTime: data.startTime ? new Date(data.startTime) : null
    },
    include: { subject: { select: { id: true, name: true, color: true } } }
  });

  res.status(201).json({ task });
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const data = updateTaskSchema.parse(req.body);

  const task = await prisma.task.findFirst({
    where: { id: req.params.id, userId: req.user!.id }
  });

  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  const updateData: any = { ...data };
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
  if (data.startTime) updateData.startTime = new Date(data.startTime);

  if (data.completed === true && !task.completed) {
    updateData.completedAt = new Date();
  } else if (data.completed === false && task.completed) {
    updateData.completedAt = null;
  }

  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data: updateData,
    include: { subject: { select: { id: true, name: true, color: true } } }
  });

  res.json({ task: updated });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.task.delete({
    where: { id: req.params.id, userId: req.user!.id }
  });
  res.json({ message: 'Task deleted' });
}));

export default router;