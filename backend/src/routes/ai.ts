import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import OpenAI from 'openai';

const router = Router();
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
  mode: z.enum(['EXPLAIN', 'QUIZ', 'FLASHCARDS', 'SUMMARY', 'STUDY_PLAN', 'PRACTICE'])
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  conversationId: z.string().optional()
});

router.get('/conversations', asyncHandler(async (req: AuthRequest, res) => {
  const conversations = await prisma.aiConversation.findMany({
    where: { userId: req.user!.id },
    include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' }
  });

  res.json({ conversations });
}));

router.post('/conversations', asyncHandler(async (req: AuthRequest, res) => {
  const data = createConversationSchema.parse(req.body);

  const conversation = await prisma.aiConversation.create({
    data: {
      ...data,
      userId: req.user!.id
    }
  });

  res.status(201).json({ conversation });
}));

router.get('/conversations/:id', asyncHandler(async (req: AuthRequest, res) => {
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  if (!conversation) {
    throw new AppError(404, 'Conversation not found');
  }

  res.json({ conversation });
}));

router.post('/conversations/:id/messages', asyncHandler(async (req: AuthRequest, res) => {
  const data = sendMessageSchema.parse(req.body);

  const conversation = await prisma.aiConversation.findFirst({
    where: { id: req.params.id, userId: req.user!.id }
  });

  if (!conversation) {
    throw new AppError(404, 'Conversation not found');
  }

  await prisma.aiMessage.create({
    data: {
      conversationId: req.params.id,
      role: 'user',
      content: data.content
    }
  });

  const context = await buildContext(req.user!.id);

  const systemPrompt = buildSystemPrompt(conversation.mode, context);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: data.content }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });

  const assistantContent = completion.choices[0].message.content || '';

  const assistantMessage = await prisma.aiMessage.create({
    data: {
      conversationId: req.params.id,
      role: 'assistant',
      content: assistantContent
    }
  });

  await prisma.aiConversation.update({
    where: { id: req.params.id },
    data: { updatedAt: new Date() }
  });

  res.json({ message: assistantMessage });
}));

router.delete('/conversations/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.aiConversation.delete({
    where: { id: req.params.id, userId: req.user!.id }
  });
  res.json({ message: 'Conversation deleted' });
}));

async function buildContext(userId: string): Promise<string> {
  const [subjects, exams, tasks, sessions] = await Promise.all([
    prisma.subject.findMany({
      where: { userId },
      select: { name: true, completedChapters: true, totalChapters: true, studyHours: true, examDate: true }
    }),
    prisma.exam.findMany({
      where: { userId, date: { gte: new Date() } },
      select: { name: true, date: true, subject: { select: { name: true } } },
      orderBy: { date: 'asc' },
      take: 5
    }),
    prisma.task.findMany({
      where: { userId, completed: false, dueDate: { gte: new Date() } },
      select: { title: true, dueDate: true, subject: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 10
    }),
    prisma.studySession.findMany({
      where: { userId },
      select: { subject: { select: { name: true } }, duration: true, startTime: true },
      orderBy: { startTime: 'desc' },
      take: 20
    })
  ]);

  const subjectSummary = subjects.map(s =>
    `${s.name}: ${s.completedChapters}/${s.totalChapters} chapters, ${s.studyHours.toFixed(1)}h${s.examDate ? `, exam: ${s.examDate.toISOString().split('T')[0]}` : ''}`
  ).join('\n');

  const examSummary = exams.map(e =>
    `${e.subject.name} ${e.name}: ${e.date.toISOString().split('T')[0]}`
  ).join('\n') || 'None';

  const taskSummary = tasks.map(t =>
    `${t.subject?.name || 'General'} - ${t.title}: due ${t.dueDate?.toISOString().split('T')[0]}`
  ).join('\n') || 'None';

  const recentStudy = sessions.slice(0, 5).map(s =>
    `${s.subject?.name || 'General'}: ${s.duration}min on ${s.startTime.toISOString().split('T')[0]}`
  ).join('\n') || 'None';

  return `
User's Subjects:
${subjectSummary}

Upcoming Exams:
${examSummary}

Pending Tasks:
${taskSummary}

Recent Study Sessions:
${recentStudy}
  `.trim();
}

function buildSystemPrompt(mode: string, context: string): string {
  const basePrompt = `You are StudyFlow's AI Study Assistant. You help students with their studies.
You have access to the student's academic context:

${context}

Guidelines:
- Be encouraging and supportive
- Use the student's actual data when providing advice
- Never make up information about their progress
- If you don't have enough data, say so honestly
- Keep responses concise but helpful
- Format responses with clear structure (bullet points, sections)`;

  const modePrompts: Record<string, string> = {
    EXPLAIN: `${basePrompt}

Mode: EXPLAIN
Explain concepts clearly with examples. Adapt to the student's level. Use their subjects as context when relevant.`,
    QUIZ: `${basePrompt}

Mode: QUIZ
Generate practice questions based on the student's subjects. Provide 3-5 questions with answers. Format as JSON with question, options, correctAnswer, explanation.`,
    FLASHCARDS: `${basePrompt}

Mode: FLASHCARDS
Create flashcards for active recall. Provide front/back format. Focus on key concepts from their subjects.`,
    SUMMARY: `${basePrompt}

Mode: SUMMARY
Create concise summaries of topics. Use bullet points. Highlight key formulas, definitions, and concepts.`,
    STUDY_PLAN: `${basePrompt}

Mode: STUDY_PLAN
Create personalized study schedules. Consider exam dates, available hours, subject priorities. Output structured daily plan.`,
    PRACTICE: `${basePrompt}

Mode: PRACTICE
Generate practice problems with step-by-step solutions. Match difficulty to their progress level.`
  };

  return modePrompts[mode] || basePrompt;
}

export default router;