import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  let streak = await prisma.streak.findUnique({
    where: { userId: req.user!.id }
  });

  if (!streak) {
    streak = await prisma.streak.create({
      data: {
        userId: req.user!.id,
        currentStreak: 0,
        longestStreak: 0,
        weeklyActivity: Array(7).fill(false)
      }
    });
  }

  const sessions = await prisma.studySession.findMany({
    where: { userId: req.user!.id },
    select: { startTime: true },
    orderBy: { startTime: 'desc' }
  });

  const studyDates = new Set(
    sessions.map(s => s.startTime.toISOString().split('T')[0])
  );

  res.json({ streak: { ...streak, studyDates: Array.from(studyDates) } });
}));

router.post('/update', asyncHandler(async (req: AuthRequest, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = await prisma.streak.findUnique({
    where: { userId: req.user!.id }
  });

  if (!streak) {
    streak = await prisma.streak.create({
      data: {
        userId: req.user!.id,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: today,
        weeklyActivity: Array(7).fill(false)
      }
    });
    res.json({ streak });
    return;
  }

  const lastDate = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
  let currentStreak = streak.currentStreak;

  if (lastDate) {
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak += 1;
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  const weeklyActivity = Array.isArray(streak.weeklyActivity)
    ? streak.weeklyActivity
    : Array(7).fill(false);
  weeklyActivity[today.getDay()] = true;

  streak = await prisma.streak.update({
    where: { userId: req.user!.id },
    data: {
      currentStreak,
      longestStreak: Math.max(streak.longestStreak, currentStreak),
      lastStudyDate: today,
      weeklyActivity
    }
  });

  res.json({ streak });
}));

export default router;