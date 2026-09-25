import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/ui';
import { BookOpenIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  grade: string;
  school: string;
  board: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        grade: data.grade || undefined,
        school: data.school || undefined,
        board: data.board || undefined
      });
      toast.success('Account created! Welcome to StudyFlow!');
      navigate('/onboarding');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const grades = [
    'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'Undergraduate', 'Postgraduate', 'Other'
  ];

  const boards = [
    'CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <BookOpenIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-display-sm font-bold text-surface-50">StudyFlow</span>
          </Link>
          <h1 className="text-heading-xl font-bold text-surface-50 mb-2">Create your account</h1>
          <p className="text-body-lg text-surface-400">Start your intelligent study journey today</p>
        </div>

        <Card className="animate-in delay-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-5">
              <Input
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
                label="Full Name"
                placeholder="Alex Johnson"
                autoComplete="name"
                error={errors.name?.message}
                iconLeft={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />

              <Input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                })}
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                iconLeft={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />

              <div className="relative">
                <Input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                  })}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  iconLeft={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-surface-500 hover:text-surface-300"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  }
                />
              </div>

              <div className="relative">
                <Input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  iconLeft={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-surface-700/50">
              <h3 className="text-heading-sm font-semibold text-surface-50 mb-4">Academic Details (Optional)</h3>
              <div className="space-y-4">
                <Input
                  {...register('grade')}
                  label="Grade / Class"
                  placeholder="Select your grade"
                  list="grade-options"
                  iconLeft={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
                <datalist id="grade-options">
                  {grades.map(g => <option key={g} value={g} />)}
                </datalist>

                <Input
                  {...register('school')}
                  label="School / College"
                  placeholder="Enter your institution"
                  iconLeft={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                />

                <Input
                  {...register('board')}
                  label="Academic Board"
                  placeholder="Select your board"
                  list="board-options"
                  iconLeft={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
                <datalist id="board-options">
                  {boards.map(b => <option key={b} value={b} />)}
                </datalist>
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-2">
              Create Account
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-body-sm text-surface-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>

        <p className="mt-4 text-center text-body-xs text-surface-600">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-primary-400 hover:text-primary-300">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-primary-400 hover:text-primary-300">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}