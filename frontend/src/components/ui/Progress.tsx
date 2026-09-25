import { clsx } from 'clsx';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'ring' | 'gradient';
  showLabel?: boolean;
  label?: string;
  color?: string;
  className?: string;
  animate?: boolean;
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  color,
  className = '',
  animate = true
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeStyles = {
    sm: { height: '4px', labelSize: 'text-xs', ringSize: 'w-12 h-12', ringStroke: '3' },
    md: { height: '6px', labelSize: 'text-sm', ringSize: 'w-16 h-16', ringStroke: '4' },
    lg: { height: '8px', labelSize: 'text-base', ringSize: 'w-20 h-20', ringStroke: '5' },
    xl: { height: '12px', labelSize: 'text-lg', ringSize: 'w-24 h-24', ringStroke: '6' }
  };

  const { height, labelSize, ringSize, ringStroke } = sizeStyles[size];

  const gradientColors = color || 'from-primary-500 to-primary-600';

  if (variant === 'ring') {
    const radius = parseInt(ringSize) / 2 - parseInt(ringStroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className={clsx('flex flex-col items-center gap-2', className)}>
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <svg className="transform -rotate-90" style={{ width: ringSize, height: ringSize }}>
            <circle
              cx={parseInt(ringSize) / 2}
              cy={parseInt(ringSize) / 2}
              r={radius}
              fill="none"
              stroke="rgba(51, 65, 85, 0.5)"
              strokeWidth={ringStroke}
            />
            <circle
              cx={parseInt(ringSize) / 2}
              cy={parseInt(ringSize) / 2}
              r={radius}
              fill="none"
              stroke={`url(#gradient-${color || 'primary'})`}
              strokeWidth={ringStroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={animate ? offset : circumference}
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))' }}
            />
            <defs>
              <linearGradient id={`gradient-${color || 'primary'}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {showLabel && (
              <span className={`font-bold ${labelSize} text-surface-50`}>
                {label ?? `${Math.round(percentage)}%`}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={clsx('w-full', className)}>
        <div className="relative h-full rounded-full overflow-hidden bg-surface-800" style={{ height }}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradientColors} transition-all duration-1000 ease-out ${animate ? '' : 'animate-none'}`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {(showLabel || label) && (
          <div className="flex items-center justify-between mt-1.5">
            <span className={`font-medium ${labelSize} text-surface-300`}>{label || 'Progress'}</span>
            <span className={`font-semibold ${labelSize} text-surface-50`}>{Math.round(percentage)}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('w-full', className)}>
      <div className="relative h-full rounded-full overflow-hidden bg-surface-800" style={{ height }}>
        <div
          className={`h-full rounded-full bg-primary-500 transition-all duration-1000 ease-out ${animate ? '' : 'animate-none'}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mt-1.5">
          <span className={`font-medium ${labelSize} text-surface-300`}>{label || 'Progress'}</span>
          <span className={`font-semibold ${labelSize} text-surface-50`}>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

interface StepProgressProps {
  steps: Array<{ label: string; completed: boolean; current?: boolean }>;
  className?: string;
}

export function StepProgress({ steps, className = '' }: StepProgressProps) {
  return (
    <div className={clsx('relative', className)}>
      <div className="absolute left-0 right-0 top-6 h-0.5 bg-surface-700" aria-hidden="true" />
      <div className="relative flex items-start justify-between">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-col items-center relative z-10">
            <div
              className={clsx(
                'w-3 h-3 rounded-full border-2 transition-all duration-300 flex items-center justify-center',
                step.completed
                  ? 'bg-primary-500 border-primary-500'
                  : step.current
                  ? 'bg-surface-900 border-primary-500 ring-4 ring-primary-500/20'
                  : 'bg-surface-900 border-surface-600'
              )}
            >
              {step.completed && (
                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={clsx(
              'mt-2 text-center text-body-xs font-medium transition-colors',
              step.completed ? 'text-primary-400' : step.current ? 'text-surface-50' : 'text-surface-500'
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}