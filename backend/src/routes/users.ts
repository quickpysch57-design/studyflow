import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
  board: z.string().optional(),
  studyGoals: z.string().optional(),
  preferredHours: z.number().min(0.5).max(12).optional(),
  preferredTime: z.enum(['morning', 'afternoon', 'evening', 'night']).optional()
});

router.get('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      grade: true,
      school: true,
      board: true,
      studyGoals: true,
      preferredHours: true,
      preferredTime: true,
      createdAt: true,
      profile: true,
      preferences: true,
      _count: {
        select: {
          subjects: true,
          tasks: true,
          exams: true,
          notes: true,
          studySessions: true
        }
      }
    }
  });

  res.json({ user });
}));

router.patch('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const data = updateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      grade: true,
      school: true,
      board: true,
      studyGoals: true,
      preferredHours: true,
      preferredTime: true
    }
  });

  res.json({ user });
}));

router.delete('/account', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.user.delete({ where: { id: req.user!.id } });
  res.clearCookie('token');
  res.json({ message: 'Account deleted successfully' });
}));

export default router;