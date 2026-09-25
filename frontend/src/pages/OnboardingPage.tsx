import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Badge, Progress } from '../components/ui';
import { BookOpenIcon, ClockIcon, FlagIcon, CalendarIcon, SparklesIcon, CheckCircleIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';

interface OnboardingData {
  name: string;
  grade: string;
  subjects: string[];
  customSubject: string;
  examDates: Record<string, string>;
  dailyTarget: number;
  preferredTime: string;
  goals: string;
}

const GRADES = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Undergraduate', 'Other'];
const DEFAULT_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'History', 'Geography', 'Economics',
  'Accountancy', 'Business Studies', 'Computer Science',
  'Physical Education', 'Psychology', 'Sociology'
];
const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (5-9 AM)', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon (12-4 PM)', icon: '☀️' },
  { value: 'evening', label: 'Evening (5-9 PM)', icon: '🌆' },
  { value: 'night', label: 'Night (9 PM-12 AM)', icon: '🌙' }
];

const STEPS = [
  { id: 1, title: 'Your Name', icon: '👋', description: 'What should we call you?' },
  { id: 2, title: 'Academic Level', icon: '🎓', description: 'What\'s your current grade?' },
  { id: 3, title: 'Subjects', icon: '📚', description: 'What subjects are you studying?' },
  { id: 4, title: 'Exam Dates', icon: '📅', description: 'When are your exams?' },
  { id: 5, title: 'Daily Target', icon: '⏰', description: 'How many hours can you study daily?' },
  { id: 6, title: 'Preferred Time', icon: '🕐', description: 'When do you study best?' },
  { id: 7, title: 'Goals', icon: '🎯', description: 'What are your study goals?' }
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OnboardingData>({
    defaultValues: {
      name: user?.name || '',
      grade: user?.grade || '',
      subjects: [],
      customSubject: '',
      examDates: {},
      dailyTarget: user?.preferredHours || 2,
      preferredTime: user?.preferredTime || 'evening',
      goals: user?.studyGoals || ''
    }
  });

  const selectedSubjects = watch('subjects') || [];
  const examDates = watch('examDates') || {};

  const nextStep = () => {
    if (step < STEPS.length) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleSubject = (subject: string) => {
    const current = selectedSubjects;
    if (current.includes(subject)) {
      setValue('subjects', current.filter(s => s !== subject));
    } else {
      setValue('subjects', [...current, subject]);
    }
  };

  const addCustomSubject = () => {
    const custom = watch('customSubject');
    if (custom.trim() && !selectedSubjects.includes(custom.trim())) {
      setValue('subjects', [...selectedSubjects, custom.trim()]);
      setValue('customSubject', '');
    }
  };

  const handleExamDateChange = (subject: string, date: string) => {
    setValue('examDates', { ...examDates, [subject]: date });
  };

  const onSubmit = async (data: OnboardingData) => {
    setLoading(true);
    try {
      await updateProfile({
        name: data.name,
        grade: data.grade,
        studyGoals: data.goals,
        preferredHours: data.dailyTarget,
        preferredTime: data.preferredTime
      });
      toast.success('Welcome to StudyFlow! Your dashboard is ready.');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 animate-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-heading-lg font-bold text-surface-50">Set up StudyFlow</h1>
              <p className="text-body-sm text-surface-400 mt-1">Step {step} of {STEPS.length} - {currentStep.title}</p>
            </div>
            <Progress value={step} max={STEPS.length} size="lg" variant="gradient" className="w-48" />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 whitespace-nowrap">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  i < step - 1 ? 'bg-primary-500 text-white' :
                  i === step - 1 ? 'bg-primary-500/20 text-primary-400 ring-2 ring-primary-500/20' :
                  'bg-surface-800 text-surface-500'
                }`}>
                  {i < step - 1 ? <CheckCircleIcon className="w-4 h-4" /> : <span className="text-lg">{s.icon}</span>}
                </div>
                {i < STEPS.length - 1 && <div className={`h-1 w-12 rounded ${i < step - 1 ? 'bg-primary-500' : 'bg-surface-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        <Card className="animate-in">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-5xl block mb-4">{currentStep.icon}</span>
                  <h2 className="text-heading-md font-semibold text-surface-50">{currentStep.title}</h2>
                  <p className="text-body-sm text-surface-400">{currentStep.description}</p>
                </div>
                <Input
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
                  label="Your Name"
                  placeholder="Enter your name"
                  autoComplete="name"
                  error={errors.name?.message}
                  iconLeft={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-5xl block mb-4">{currentStep.icon}</span>
                  <h2 className="text-heading-md font-semibold text-surface-50">{currentStep.title}</h2>
                  <p className="text-body-sm text-surface-400">{currentStep.description}</p>
                </div>
                <Input
                  {...register('grade', { required: 'Please select your grade' })}
                  label="Grade / Class"
                  placeholder="Select your grade"
                  list="grade-options"
                  error={errors.grade?.message}
                  iconLeft={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
                <datalist id="grade-options">
                  {GRADES.map(g => <option key={g} value={g} />)}
                </datalist>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-5xl block mb-4">{currentStep.icon}</span>
                  <h2 className="text-heading-md font-semibold text-surface-50">{currentStep.title}</h2>
                  <p className="text-body-sm text-surface-400">{currentStep.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`px-3 py-2 rounded-xl text-body-sm font-medium border transition-all ${
                        selectedSubjects.includes(subject)
                          ? 'bg-primary-500/20 border-primary-500/30 text-primary-400'
                          : 'bg-surface-800 border-surface-600 text-surface-300 hover:border-primary-500/50 hover:text-surface-100'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    {...register('customSubject')}
                    placeholder="Add custom subject..."
                    value={watch('customSubject')}
                    onChange={(e) => setValue('customSubject', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSubject())}
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={addCustomSubject}>Add</Button>
                </div>
                {selectedSubjects.length === 0 && (
                  <p className="text-body-xs text-red-400">Please select at least one subject</p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-5xl block mb-4">{currentStep.icon}</span>
                  <h2 className="text-heading-md font-semibold text-surface-50">{currentStep.title}</h2>
                  <p className="text-body-sm text-surface-400">{currentStep.description}</p>
                </div>
                {selectedSubjects.length === 0 ? (
                  <p className="text-body-sm text-surface-500 text-center py-8">Add subjects in the previous step to set exam dates</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedSubjects.map(subject => (
                      <div key={subject} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                        <Badge variant="outline" className="w-24 text-center">{subject}</Badge>
                        <input
                          type="date"
                          value={examDates[subject] || ''}
                          onChange={(e) => handleExamDateChange(subject, e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg bg-surface-900 border border-surface-700 text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-5xl block mb-4">{currentStep.icon}</span>
                  <h2 className="text-heading-md font-semibold text-surface-50">{currentStep.title}</h2>
                  <p className="text-body-sm text-surface-400">{currentStep.description}</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setValue('dailyTarget', hours)}
                      className={`px-4 py-4 rounded-xl text-body-sm font-medium border transition-all ${
                        watch('dailyTarget') === hours
                          ? 'bg-primary-500/20 border-primary-500/30 text-primary-400'
                          : 'bg-surface-800 border-surface-600 text-surface-300 hover:border-primary-500/50'
                      }`}
                    >
                      <span className="block font-semibold">{hours}h</span>
                      <span className="text-xs text-surface-500">{hours === 0.5 ? '30m' : `${Math.round(hours * 60)}m`}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-5xl block mb-4">{currentStep.icon}</span>
                  <h2 className="text-heading-md font-semibold text-surface-50">{currentStep.title}</h2>
                  <p className="text-body-sm text-surface-400">{currentStep.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TIME_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue('preferredTime', option.value)}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        watch('preferredTime') === option.value
                          ? 'bg-primary-500/20 border-primary-500/30'
                          : 'bg-surface-800 border-surface-600 hover:border-primary-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <p className="font-medium text-surface-50">{option.label}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-5xl block mb-4">{currentStep.icon}</span>
                  <h2 className="text-heading-md font-semibold text-surface-50">{currentStep.title}</h2>
                  <p className="text-body-sm text-surface-400">{currentStep.description}</p>
                </div>
                <div className="space-y-3">
                  <textarea
                    {...register('goals')}
                    rows={4}
                    placeholder="What do you want to achieve? (e.g., Score 95% in boards, crack JEE, improve time management)"
                    className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-surface-50 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none text-body-md"
                  />
                  <div className="flex flex-wrap gap-2">
                    {['Score 90%+ in exams', 'Complete syllabus early', 'Build consistent study habit', 'Reduce exam anxiety', 'Master difficult topics'].map(goal => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => {
                          const current = watch('goals');
                          setValue('goals', current ? `${current}\n${goal}` : goal);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-600 text-body-xs text-surface-400 hover:border-primary-500/50 hover:text-surface-300"
                      >
                        + {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-surface-700/50">
              <Button type="button" variant="ghost" onClick={prevStep} disabled={step === 1}>
                <ChevronLeftIcon className="h-5 w-5" />
                Back
              </Button>
              {step < STEPS.length ? (
                <Button type="button" variant="primary" onClick={nextStep} disabled={step === 3 && selectedSubjects.length === 0}>
                  Next
                  <ChevronRightIcon className="h-5 w-5" />
                </Button>
              ) : (
                <Button type="submit" variant="primary" loading={loading} fullWidth>
                  Complete Setup
                  <SparklesIcon className="h-5 w-5" />
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}