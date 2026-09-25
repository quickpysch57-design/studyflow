import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  grade: z.string().optional(),
  school: z.string().optional(),
  board: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      grade: data.grade,
      school: data.school,
      board: data.board
    },
    select: { id: true, email: true, name: true }
  });

  const token = generateToken(user);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.status(201).json({ user, token });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);

  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token
  });
}));

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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
      preferences: true
    }
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({ user });
}));

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.json({ message: 'If the email exists, a reset link will be sent' });
    return;
  }

  res.json({ message: 'If the email exists, a reset link will be sent' });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = z.object({
    token: z.string(),
    password: z.string().min(8)
  }).parse(req.body);

  res.json({ message: 'Password reset functionality to be implemented' });
}));

export default router;