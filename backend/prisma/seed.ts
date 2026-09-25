import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@studyflow.app' },
    update: {},
    create: {
      email: 'demo@studyflow.app',
      passwordHash,
      name: 'Alex',
      grade: 'Class 12',
      school: 'Springfield High',
      board: 'CBSE',
      studyGoals: 'Score 95% in board exams, get into IIT',
      preferredHours: 3,
      preferredTime: 'evening'
    }
  });

  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { id: 'math-subject' },
      update: {},
      create: {
        id: 'math-subject',
        userId: user.id,
        name: 'Mathematics',
        color: '#ef4444',
        icon: 'calculator',
        teacher: 'Mr. Sharma',
        totalChapters: 12,
        completedChapters: 8,
        studyHours: 24.5,
        examDate: new Date('2026-03-15')
      }
    }),
    prisma.subject.upsert({
      where: { id: 'physics-subject' },
      update: {},
      create: {
        id: 'physics-subject',
        userId: user.id,
        name: 'Physics',
        color: '#3b82f6',
        icon: 'atom',
        teacher: 'Ms. Patel',
        totalChapters: 10,
        completedChapters: 5,
        studyHours: 18.0,
        examDate: new Date('2026-03-18')
      }
    }),
    prisma.subject.upsert({
      where: { id: 'chemistry-subject' },
      update: {},
      create: {
        id: 'chemistry-subject',
        userId: user.id,
        name: 'Chemistry',
        color: '#22c55e',
        icon: 'flask',
        teacher: 'Dr. Kumar',
        totalChapters: 14,
        completedChapters: 9,
        studyHours: 22.0,
        examDate: new Date('2026-03-20')
      }
    }),
    prisma.subject.upsert({
      where: { id: 'english-subject' },
      update: {},
      create: {
        id: 'english-subject',
        userId: user.id,
        name: 'English',
        color: '#f59e0b',
        icon: 'book',
        teacher: 'Mrs. Singh',
        totalChapters: 8,
        completedChapters: 6,
        studyHours: 12.0,
        examDate: new Date('2026-03-12')
      }
    })
  ]);

  const mathChapters = [
    { name: 'Relations and Functions', status: 'COMPLETED', progress: 100, order: 1 },
    { name: 'Inverse Trigonometric Functions', status: 'COMPLETED', progress: 100, order: 2 },
    { name: 'Matrices', status: 'COMPLETED', progress: 100, order: 3 },
    { name: 'Determinants', status: 'COMPLETED', progress: 100, order: 4 },
    { name: 'Continuity and Differentiability', status: 'COMPLETED', progress: 100, order: 5 },
    { name: 'Applications of Derivatives', status: 'COMPLETED', progress: 100, order: 6 },
    { name: 'Integrals', status: 'COMPLETED', progress: 100, order: 7 },
    { name: 'Applications of Integrals', status: 'COMPLETED', progress: 100, order: 8 },
    { name: 'Differential Equations', status: 'PRACTICING', progress: 65, order: 9 },
    { name: 'Vector Algebra', status: 'LEARNING', progress: 30, order: 10 },
    { name: 'Three Dimensional Geometry', status: 'NOT_STARTED', progress: 0, order: 11 },
    { name: 'Linear Programming', status: 'NOT_STARTED', progress: 0, order: 12 }
  ];

  for (const ch of mathChapters) {
    await prisma.chapter.upsert({
      where: { id: `math-ch-${ch.order}` },
      update: {},
      create: {
        id: `math-ch-${ch.order}`,
        userId: user.id,
        subjectId: subjects[0].id,
        name: ch.name,
        status: ch.status as any,
        progress: ch.progress,
        order: ch.order,
        studyTime: ch.status === 'COMPLETED' ? 120 : ch.status === 'PRACTICING' ? 90 : ch.status === 'LEARNING' ? 45 : 0,
        revisionCount: ch.status === 'COMPLETED' ? 2 : 0,
        lastStudiedAt: ch.status !== 'NOT_STARTED' ? new Date(Date.now() - Math.random() * 7 * 86400000) : null
      }
    });
  }

  const physicsChapters = [
    { name: 'Electric Charges and Fields', status: 'COMPLETED', progress: 100, order: 1 },
    { name: 'Electrostatic Potential and Capacitance', status: 'COMPLETED', progress: 100, order: 2 },
    { name: 'Current Electricity', status: 'COMPLETED', progress: 100, order: 3 },
    { name: 'Moving Charges and Magnetism', status: 'COMPLETED', progress: 100, order: 4 },
    { name: 'Magnetism and Matter', status: 'COMPLETED', progress: 100, order: 5 },
    { name: 'Electromagnetic Induction', status: 'PRACTICING', progress: 55, order: 6 },
    { name: 'Alternating Current', status: 'LEARNING', progress: 25, order: 7 },
    { name: 'Electromagnetic Waves', status: 'NOT_STARTED', progress: 0, order: 8 },
    { name: 'Ray Optics', status: 'NOT_STARTED', progress: 0, order: 9 },
    { name: 'Wave Optics', status: 'NOT_STARTED', progress: 0, order: 10 }
  ];

  for (const ch of physicsChapters) {
    await prisma.chapter.upsert({
      where: { id: `physics-ch-${ch.order}` },
      update: {},
      create: {
        id: `physics-ch-${ch.order}`,
        userId: user.id,
        subjectId: subjects[1].id,
        name: ch.name,
        status: ch.status as any,
        progress: ch.progress,
        order: ch.order,
        studyTime: ch.status === 'COMPLETED' ? 110 : ch.status === 'PRACTICING' ? 75 : ch.status === 'LEARNING' ? 40 : 0,
        revisionCount: ch.status === 'COMPLETED' ? 1 : 0,
        lastStudiedAt: ch.status !== 'NOT_STARTED' ? new Date(Date.now() - Math.random() * 7 * 86400000) : null
      }
    });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  await Promise.all([
    prisma.task.upsert({
      where: { id: 'task-1' },
      update: {},
      create: {
        id: 'task-1',
        userId: user.id,
        subjectId: subjects[0].id,
        title: 'Complete Differential Equations exercises',
        description: 'Exercise 9.1 to 9.6 from NCERT',
        type: 'HOMEWORK',
        priority: 'HIGH',
        dueDate: new Date(todayStart.getTime() + 2 * 86400000),
        duration: 90
      }
    }),
    prisma.task.upsert({
      where: { id: 'task-2' },
      update: {},
      create: {
        id: 'task-2',
        userId: user.id,
        subjectId: subjects[1].id,
        title: 'Physics lab report - Electromagnetic Induction',
        type: 'ASSIGNMENT',
        priority: 'HIGH',
        dueDate: new Date(todayStart.getTime() + 1 * 86400000),
        duration: 60
      }
    }),
    prisma.task.upsert({
      where: { id: 'task-3' },
      update: {},
      create: {
        id: 'task-3',
        userId: user.id,
        subjectId: subjects[2].id,
        title: 'Organic Chemistry revision - Aldehydes & Ketones',
        type: 'REVISION',
        priority: 'MEDIUM',
        dueDate: new Date(todayStart.getTime() + 3 * 86400000),
        duration: 120
      }
    }),
    prisma.task.upsert({
      where: { id: 'task-4' },
      update: {},
      create: {
        id: 'task-4',
        userId: user.id,
        title: 'English essay - Environmental Conservation',
        type: 'ASSIGNMENT',
        priority: 'MEDIUM',
        dueDate: new Date(todayStart.getTime() + 5 * 86400000),
        duration: 60
      }
    }),
    prisma.task.upsert({
      where: { id: 'task-5' },
      update: {},
      create: {
        id: 'task-5',
        userId: user.id,
        subjectId: subjects[0].id,
        title: 'Vector Algebra practice problems',
        type: 'PRACTICE',
        priority: 'MEDIUM',
        dueDate: new Date(todayStart.getTime() + 4 * 86400000),
        duration: 90
      }
    })
  ]);

  await Promise.all([
    prisma.exam.upsert({
      where: { id: 'exam-1' },
      update: {},
      create: {
        id: 'exam-1',
        userId: user.id,
        subjectId: subjects[3].id,
        name: 'English Core',
        date: new Date('2026-03-12'),
        syllabus: 'Reading comprehension, Writing skills, Literature (Flamingo + Vistas)',
        preparationPct: 75
      }
    }),
    prisma.exam.upsert({
      where: { id: 'exam-2' },
      update: {},
      create: {
        id: 'exam-2',
        userId: user.id,
        subjectId: subjects[0].id,
        name: 'Mathematics',
        date: new Date('2026-03-15'),
        syllabus: 'Full NCERT Class 12 syllabus',
        preparationPct: 68
      }
    }),
    prisma.exam.upsert({
      where: { id: 'exam-3' },
      update: {},
      create: {
        id: 'exam-3',
        userId: user.id,
        subjectId: subjects[1].id,
        name: 'Physics',
        date: new Date('2026-03-18'),
        syllabus: 'Full NCERT Class 12 syllabus',
        preparationPct: 52
      }
    }),
    prisma.exam.upsert({
      where: { id: 'exam-4' },
      update: {},
      create: {
        id: 'exam-4',
        userId: user.id,
        subjectId: subjects[2].id,
        name: 'Chemistry',
        date: new Date('2026-03-20'),
        syllabus: 'Full NCERT Class 12 syllabus',
        preparationPct: 64
      }
    })
  ]);

  await Promise.all([
    prisma.note.upsert({
      where: { id: 'note-1' },
      update: {},
      create: {
        id: 'note-1',
        userId: user.id,
        subjectId: subjects[0].id,
        title: 'Integration Formulas Cheat Sheet',
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Basic Integrals' }] },
            { type: 'bulletList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '∫ x^n dx = x^(n+1)/(n+1) + C' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '∫ e^x dx = e^x + C' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '∫ 1/x dx = ln|x| + C' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '∫ sin x dx = -cos x + C' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '∫ cos x dx = sin x + C' }] }] }
            ]}
          ]
        }),
        tags: ['formulas', 'integration', 'quick-reference'],
        pinned: true
      }
    }),
    prisma.note.upsert({
      where: { id: 'note-2' },
      update: {},
      create: {
        id: 'note-2',
        userId: user.id,
        subjectId: subjects[1].id,
        title: 'Faraday\'s Laws of Electromagnetic Induction',
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'First Law' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Whenever magnetic flux linked with a circuit changes, an EMF is induced in the circuit.' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Second Law' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'The magnitude of induced EMF is equal to the rate of change of magnetic flux.' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'ε = -dΦ/dt' }] }
          ]
        }),
        tags: ['physics', 'electromagnetic-induction', 'laws'],
        pinned: false
      }
    })
  ]);

  const sessionData = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const sessionsPerDay = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < sessionsPerDay; j++) {
      const subjectIdx = Math.floor(Math.random() * subjects.length);
      const startHour = 17 + Math.floor(Math.random() * 4);
      const start = new Date(date);
      start.setHours(startHour, Math.floor(Math.random() * 4) * 15, 0, 0);
      const duration = [45, 60, 90, 120][Math.floor(Math.random() * 4)];
      const end = new Date(start.getTime() + duration * 60000);
      sessionData.push(
        prisma.studySession.create({
          data: {
            userId: user.id,
            subjectId: subjects[subjectIdx].id,
            startTime: start,
            endTime: end,
            duration,
            type: ['FOCUS', 'POMODORO', 'STUDY', 'REVISION'][Math.floor(Math.random() * 4)] as any
          }
        })
      );
    }
  }
  await Promise.all(sessionData);

  await prisma.streak.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentStreak: 7,
      longestStreak: 14,
      lastStudyDate: new Date(now.getTime() - 86400000),
      weeklyActivity: [true, true, true, true, true, false, true]
    }
  });

  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'SYSTEM',
      notifications: true,
      studyReminders: true,
      breakReminders: true,
      pomodoroWork: 25,
      pomodoroBreak: 5,
      pomodoroLongBreak: 15,
      sessionsUntilLongBreak: 4
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });