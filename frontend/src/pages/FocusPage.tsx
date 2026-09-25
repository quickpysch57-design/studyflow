import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, Progress, Badge, Input } from '../components/ui';
import {
  PlayIcon, PauseIcon, StopIcon, ForwardIcon, BackwardIcon,
  ClockIcon, SunIcon, MoonIcon, BookOpenIcon, CheckCircleIcon,
  FireIcon, SparklesIcon, BellIcon, MusicalNoteIcon
} from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';
import { format } from 'date-fns';

const POMODORO_PRESETS = [
  { label: 'Classic', work: 25, break: 5, longBreak: 15, sessions: 4, icon: ClockIcon },
  { label: 'Deep Work', work: 50, break: 10, longBreak: 20, sessions: 3, icon: SparklesIcon },
  { label: 'Ultradian', work: 90, break: 20, longBreak: 30, sessions: 2, icon: MoonIcon },
];

type TimerMode = 'work' | 'break' | 'longBreak';
type TimerState = 'idle' | 'running' | 'paused';

export function FocusPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<TimerMode>('work');
  const [state, setState] = useState<TimerState>('idle');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [preset, setPreset] = useState(POMODORO_PRESETS[0]);
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartWork, setAutoStartWork] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    fetchSubjects();
    loadPreferences();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/api/subjects');
      setSubjects(res.data.subjects);
    } catch { console.error('Failed to fetch subjects'); }
  };

  const loadPreferences = async () => {
    try {
      const res = await api.get('/api/users/profile');
      const prefs = res.data.user.preferences;
      if (prefs) {
        setCustomWork(prefs.pomodoroWork || 25);
        setCustomBreak(prefs.pomodoroBreak || 5);
        setSoundEnabled(prefs.breakReminders !== false);
      }
    } catch { }
  };

  const getCurrentDuration = () => {
    switch (mode) {
      case 'work': return preset.work * 60;
      case 'break': return preset.break * 60;
      case 'longBreak': return preset.longBreak * 60;
    }
  };

  const progress = ((getCurrentDuration() - timeLeft) / getCurrentDuration()) * 100;

  const playSound = (frequency: number, duration: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch { }
  };

  const startTimer = () => {
    if (state === 'running') return;
    setState('running');
    if (state === 'idle') {
      setTimeLeft(getCurrentDuration());
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState('paused');
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState('idle');
    setTimeLeft(getCurrentDuration());
  };

  const handleTimerComplete = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (mode === 'work') {
      playSound(880, 0.5);
      setSessionsCompleted(prev => prev + 1);
      setTotalFocusTime(prev => prev + preset.work);

      if (sessionsCompleted + 1 >= preset.sessions) {
        setMode('longBreak');
        if (autoStartBreaks) setTimeout(startTimer, 1000);
        else setState('idle');
      } else {
        setMode('break');
        if (autoStartBreaks) setTimeout(startTimer, 1000);
        else setState('idle');
      }
      saveSession();
    } else {
      playSound(440, 0.5);
      setMode('work');
      if (autoStartWork) setTimeout(startTimer, 1000);
      else setState('idle');
    }
  };

  const saveSession = async () => {
    if (!currentSubject) return;
    try {
      await api.post('/api/study-sessions', {
        subjectId: currentSubject,
        startTime: new Date(Date.now() - preset.work * 60000).toISOString(),
        endTime: new Date().toISOString(),
        duration: preset.work,
        type: 'POMODORO'
      });
    } catch { }
  };

  const skipSession = () => {
    if (mode === 'work') {
      setSessionsCompleted(prev => prev + 1);
      setTotalFocusTime(prev => prev + Math.floor((getCurrentDuration() - timeLeft) / 60));
    }
    handleTimerComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setTimeLeft(getCurrentDuration());
  }, [preset, mode]);

  useEffect(() => {
    document.title = `${formatTime(timeLeft)} ${mode === 'work' ? '📚' : '☕'} StudyFlow`;
    return () => { document.title = 'StudyFlow'; };
  }, [timeLeft, mode]);

  return (
    <div className="min-h-screen animate-in">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-display-sm font-bold text-surface-50 mb-2">Focus Mode</h1>
          <p className="text-body-lg text-surface-400">Deep work sessions with Pomodoro technique</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
                <FireIcon className="h-7 w-7 text-primary-400" />
              </div>
              <p className="text-heading-lg font-bold text-surface-50">{sessionsCompleted}</p>
              <p className="text-body-sm text-surface-400">Sessions Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <ClockIcon className="h-7 w-7 text-green-400" />
              </div>
              <p className="text-heading-lg font-bold text-surface-50">{Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m</p>
              <p className="text-body-sm text-surface-400">Focus Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                <SparklesIcon className="h-7 w-7 text-purple-400" />
              </div>
              <p className="text-heading-lg font-bold text-surface-50">{preset.sessions - (sessionsCompleted % preset.sessions)}</p>
              <p className="text-body-sm text-surface-400">Until Long Break</p>
            </CardContent>
          </Card>
        </div>

        <Card className="p-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            {POMODORO_PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => { setPreset(p); resetTimer(); }}
                className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all ${
                  preset.label === p.label
                    ? 'bg-primary-500/20 border border-primary-500/30'
                    : 'bg-surface-800/50 border border-surface-700/50 hover:border-primary-500/20'
                }`}
              >
                <p.icon className={`h-6 w-6 ${preset.label === p.label ? 'text-primary-400' : 'text-surface-500'}`} />
                <span className="font-medium text-body-sm">{p.label}</span>
                <span className="text-body-xs text-surface-500">{p.work}/{p.break}min</span>
              </button>
            ))}
          </div>

          <div className="relative w-64 h-64 mx-auto mb-8">
            <Progress value={progress} size="xl" variant="ring" color={mode === 'work' ? '#ef4444' : mode === 'break' ? '#22c55e' : '#3b82f6'} showLabel />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-display-lg font-bold text-surface-50 tabular-nums">{formatTime(timeLeft)}</span>
              <span className="text-body-md text-surface-400 mt-2 uppercase tracking-wider">
                {mode === 'work' ? 'Focus Time' : mode === 'break' ? 'Short Break' : 'Long Break'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            {state === 'idle' && (
              <Button variant="primary" size="lg" onClick={startTimer} className="w-40">
                <PlayIcon className="h-6 w-6" /> Start
              </Button>
            )}
            {state === 'running' && (
              <Button variant="secondary" size="lg" onClick={pauseTimer} className="w-40">
                <PauseIcon className="h-6 w-6" /> Pause
              </Button>
            )}
            {state === 'paused' && (
              <>
                <Button variant="primary" size="lg" onClick={startTimer} className="w-40">
                  <PlayIcon className="h-6 w-6" /> Resume
                </Button>
                <Button variant="ghost" size="lg" onClick={resetTimer}>
                  <BackwardIcon className="h-6 w-6" /> Reset
                </Button>
              </>
            )}
            {(state === 'running' || state === 'paused') && (
              <Button variant="ghost" size="lg" onClick={skipSession}>
                <ForwardIcon className="h-6 w-6" /> Skip
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 text-body-sm text-surface-500">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500" />
              <BellIcon className="h-4 w-4" /> Sounds
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoStartBreaks} onChange={e => setAutoStartBreaks(e.target.checked)} className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500" />
              Auto-start breaks
            </label>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5" /> Current Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={currentSubject}
                onChange={e => setCurrentSubject(e.target.value)}
                className="input"
              >
                <option value="">Select a subject (optional)</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {currentSubject && (
                <div className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                  <p className="font-medium text-surface-50">{subjects.find(s => s.id === currentSubject)?.name}</p>
                  <p className="text-body-xs text-surface-500">This session will be logged to this subject</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" /> Session Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SessionLog />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SessionLog() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/study-sessions', { params: { startDate: format(new Date(), 'yyyy-MM-dd') } })
      .then(res => { setSessions(res.data.sessions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton variant="text" width="100%" height="60px" />;

  if (sessions.length === 0) {
    return <p className="text-surface-400 text-center py-8">No sessions today yet</p>;
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {sessions.slice(0, 10).map(session => (
        <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-surface-50 text-body-xs font-medium" style={{ backgroundColor: session.subject?.color + '20' || '#6366f120' }}>
              {format(new Date(session.startTime), 'h:mm a')}
            </div>
            <div>
              <p className="font-medium text-surface-50">{session.subject?.name || 'General'}</p>
              <p className="text-body-xs text-surface-500">{session.duration}min • {session.type}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}