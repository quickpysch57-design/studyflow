import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { unreadOnly } = req.query;

  const where: any = { userId: req.user!.id };
  if (unreadOnly === 'true') where.read = false;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.json({ notifications });
}));

router.patch('/:id/read', asyncHandler(async (req: AuthRequest, res) => {
  const notification = await prisma.notification.update({
    where: { id: req.params.id, userId: req.user!.id },
    data: { read: true }
  });
  res.json({ notification });
}));

router.patch('/read-all', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, read: false },
    data: { read: true }
  });
  res.json({ message: 'All notifications marked as read' });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.notification.delete({
    where: { id: req.params.id, userId: req.user!.id }
  });
  res.json({ message: 'Notification deleted' });
}));

export default router;