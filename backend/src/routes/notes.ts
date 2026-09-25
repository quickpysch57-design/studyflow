import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const createNoteSchema = z.object({
  subjectId: z.string().optional(),
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional()
});

const updateNoteSchema = createNoteSchema.partial();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { subjectId, search, pinned } = req.query;

  let where: any = { userId: req.user!.id };

  if (subjectId) where.subjectId = subjectId;
  if (pinned === 'true') where.pinned = true;

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { content: { contains: search as string, mode: 'insensitive' } },
      { tags: { has: search as string } }
    ];
  }

  const notes = await prisma.note.findMany({
    where,
    include: { subject: { select: { id: true, name: true, color: true } } },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }]
  });

  res.json({ notes });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const data = createNoteSchema.parse(req.body);

  if (data.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, userId: req.user!.id }
    });
    if (!subject) {
      throw new AppError(404, 'Subject not found');
    }
  }

  const note = await prisma.note.create({
    data: {
      ...data,
      userId: req.user!.id,
      tags: data.tags ?? []
    },
    include: { subject: { select: { id: true, name: true, color: true } } }
  });

  res.status(201).json({ note });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { subject: { select: { id: true, name: true, color: true } } }
  });

  if (!note) {
    throw new AppError(404, 'Note not found');
  }

  res.json({ note });
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const data = updateNoteSchema.parse(req.body);

  const note = await prisma.note.update({
    where: { id: req.params.id, userId: req.user!.id },
    data: {
      ...data,
      tags: data.tags ?? undefined
    },
    include: { subject: { select: { id: true, name: true, color: true } } }
  });

  res.json({ note });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.note.delete({
    where: { id: req.params.id, userId: req.user!.id }
  });
  res.json({ message: 'Note deleted' });
}));

export default router;