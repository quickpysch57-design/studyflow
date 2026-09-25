import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import subjectRoutes from './routes/subjects.js';
import chapterRoutes from './routes/chapters.js';
import taskRoutes from './routes/tasks.js';
import examRoutes from './routes/exams.js';
import noteRoutes from './routes/notes.js';
import studySessionRoutes from './routes/studySessions.js';
import studyPlanRoutes from './routes/studyPlans.js';
import streakRoutes from './routes/streaks.js';
import notificationRoutes from './routes/notifications.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import calendarRoutes from './routes/calendar.js';
import searchRoutes from './routes/search.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/subjects', authMiddleware, subjectRoutes);
app.use('/api/chapters', authMiddleware, chapterRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/exams', authMiddleware, examRoutes);
app.use('/api/notes', authMiddleware, noteRoutes);
app.use('/api/study-sessions', authMiddleware, studySessionRoutes);
app.use('/api/study-plans', authMiddleware, studyPlanRoutes);
app.use('/api/streaks', authMiddleware, streakRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/search', authMiddleware, searchRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`StudyFlow API running on port ${PORT}`);
});

export default app;