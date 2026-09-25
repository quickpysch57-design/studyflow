import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge, Modal } from '../components/ui';
import {
  UserCircleIcon, BellIcon, BeakerIcon, SparklesIcon,
  LockClosedIcon, ShieldCheckIcon, TrashIcon, MoonIcon,
  SunIcon, ComputerDesktopIcon, ArrowRightOnRectangleIcon,
  PencilIcon, EyeIcon, EyeSlashIcon
} from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  emailReminders: boolean;
  studyReminders: boolean;
  breakReminders: boolean;
  pomodoroWork: number;
  pomodoroBreak: number;
  pomodoroLongBreak: number;
  sessionsUntilLongBreak: number;
  language: string;
}

export function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    notifications: true,
    emailReminders: false,
    studyReminders: true,
    breakReminders: true,
    pomodoroWork: 25,
    pomodoroBreak: 5,
    pomodoroLongBreak: 15,
    sessionsUntilLongBreak: 4,
    language: 'en'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordModal, setPasswordModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/api/users/profile');
      if (res.data.user.preferences) {
        setPreferences(res.data.user.preferences);
      }
    } catch { }
    finally { setLoading(false); }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await api.patch('/api/users/profile', { preferences });
      toast.success('Preferences saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setPreferences(prev => ({ ...prev, theme: newTheme }));
  };

  const changePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) { toast.error('Passwords do not match'); return; }
    if (passwordForm.new.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      await api.post('/api/auth/reset-password', { token: '', password: passwordForm.new });
      toast.success('Password changed');
      setPasswordModal(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch { toast.error('Failed to change password'); }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/api/users/account');
      logout();
      toast.success('Account deleted');
    } catch { toast.error('Failed to delete account'); }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: SunIcon, desc: 'Always use light mode' },
    { value: 'dark', label: 'Dark', icon: MoonIcon, desc: 'Always use dark mode' },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon, desc: 'Match system setting' }
  ];

  if (loading) {
    return <div className="space-y-6"><Skeleton variant="text" width="40%" height="2rem" /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-display-sm font-bold text-surface-50">Settings</h1>
        <p className="text-body-lg text-surface-400 mt-1">Customize your StudyFlow experience</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircleIcon className="h-6 w-6" />
            <CardTitle>Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-heading-md font-semibold text-surface-50">{user?.name}</h3>
              <p className="text-surface-400">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user?.grade && <Badge variant="outline">{user.grade}</Badge>}
                {user?.school && <Badge variant="outline">{user.school}</Badge>}
                {user?.board && <Badge variant="outline">{user.board}</Badge>}
              </div>
            </div>
            <Button variant="primary" onClick={() => {}}>Edit Profile</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-surface-700/50">
            <Input label="Study Goals" placeholder="Your academic goals..." value={user?.studyGoals || ''} onChange={e => updateProfile({ studyGoals: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Daily Target (hours)" type="number" min={0.5} max={12} step={0.5} value={user?.preferredHours || 2} onChange={e => updateProfile({ preferredHours: parseFloat(e.target.value) })} />
              <select className="input" value={user?.preferredTime || 'evening'} onChange={e => updateProfile({ preferredTime: e.target.value })}>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BeakerIcon className="h-6 w-6" />
            <CardTitle>Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="label">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value as any)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    theme === option.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-surface-700 bg-surface-800/50 hover:border-primary-500/30'
                  }`}
                >
                  <option.icon className={`h-6 w-6 mb-2 ${theme === option.value ? 'text-primary-400' : 'text-surface-500'}`} />
                  <p className="font-medium text-surface-50">{option.label}</p>
                  <p className="text-body-xs text-surface-500">{option.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-body-xs text-surface-500 mt-2">Current: {resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BellIcon className="h-6 w-6" />
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleSetting label="Push Notifications" description="Receive browser notifications" value={preferences.notifications} onChange={v => setPreferences(p => ({ ...p, notifications: v }))} />
          <ToggleSetting label="Study Reminders" description="Remind me when it's time to study" value={preferences.studyReminders} onChange={v => setPreferences(p => ({ ...p, studyReminders: v }))} />
          <ToggleSetting label="Break Reminders" description="Notify me when to take breaks" value={preferences.breakReminders} onChange={v => setPreferences(p => ({ ...p, breakReminders: v }))} />
          <ToggleSetting label="Email Reminders" description="Send email notifications for important events" value={preferences.emailReminders} onChange={v => setPreferences(p => ({ ...p, emailReminders: v }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6" />
            <CardTitle>Focus Mode (Pomodoro)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Work Duration (min)" type="number" min={5} max={120} value={preferences.pomodoroWork} onChange={e => setPreferences(p => ({ ...p, pomodoroWork: parseInt(e.target.value) }))} />
            <Input label="Short Break (min)" type="number" min={1} max={30} value={preferences.pomodoroBreak} onChange={e => setPreferences(p => ({ ...p, pomodoroBreak: parseInt(e.target.value) }))} />
            <Input label="Long Break (min)" type="number" min={5} max={60} value={preferences.pomodoroLongBreak} onChange={e => setPreferences(p => ({ ...p, pomodoroLongBreak: parseInt(e.target.value) }))} />
          </div>
          <Input label="Sessions Until Long Break" type="number" min={2} max={10} value={preferences.sessionsUntilLongBreak} onChange={e => setPreferences(p => ({ ...p, sessionsUntilLongBreak: parseInt(e.target.value) }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <LockClosedIcon className="h-6 w-6" />
            <CardTitle>Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => setPasswordModal(true)}>Change Password</Button>
          <p className="text-body-sm text-surface-500">Your password is encrypted and never stored in plain text.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-6 w-6" />
            <CardTitle>Privacy & Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-surface-50">Export Data</p>
              <p className="text-body-sm text-surface-500">Download all your study data as JSON</p>
            </div>
            <Button variant="outline" onClick={() => {}}>Export</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-surface-50">Delete Account</p>
              <p className="text-body-sm text-surface-500">Permanently delete your account and all data</p>
            </div>
            <Button variant="danger" onClick={() => setDeleteModal(true)}>
              <TrashIcon className="h-5 w-5" /> Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <CardTitle>Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" onClick={logout} className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <ArrowRightOnRectangleIcon className="h-5 w-5" /> Logout
          </Button>
        </CardContent>
      </Card>

      <Modal isOpen={passwordModal} onClose={() => setPasswordModal(false)} title="Change Password" size="md">
        <div className="space-y-4">
          <Input label="Current Password" type={showPassword ? 'text' : 'password'} value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} iconRight={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-surface-500">{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>} />
          <Input label="New Password" type={showPassword ? 'text' : 'password'} value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
          <Input label="Confirm New Password" type={showPassword ? 'text' : 'password'} value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50">
            <Button variant="ghost" onClick={() => setPasswordModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={changePassword}>Change Password</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account" variant="danger">
        <p className="text-surface-300 mb-6">This action is irreversible. All your subjects, tasks, notes, study sessions, and progress will be permanently deleted.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={deleteAccount}>Delete Forever</Button>
        </div>
      </Modal>
    </div>
  );
}

function ToggleSetting({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700/50 cursor-pointer hover:border-primary-500/30">
      <div>
        <p className="font-medium text-surface-50">{label}</p>
        <p className="text-body-sm text-surface-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500"
      />
    </label>
  );
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-2xl bg-surface-900/50 border border-surface-700/50 ${className}`}>
      <div className="h-6 w-1/4 bg-surface-800 rounded animate-pulse mb-4" />
      <div className="h-4 w-1/2 bg-surface-800 rounded animate-pulse" />
    </div>
  );
}