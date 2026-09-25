interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'wave',
  className = '',
  ...props
}: SkeletonProps) {
  const baseStyles = {
    background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '0.75rem'
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    text: { height: height || '1rem', borderRadius: '9999px' },
    circular: { borderRadius: '9999px', width: width || '3rem', height: height || '3rem' },
    rectangular: { borderRadius: '0.75rem' },
    card: { borderRadius: '1rem' }
  };

  const animationStyles = {
    pulse: { animation: 'pulseSoft 2s infinite' },
    wave: { animation: 'shimmer 1.5s infinite' },
    none: {}
  };

  return (
    <div
      {...props}
      className={className}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...animationStyles[animation],
        width: variant !== 'text' ? width : undefined,
        height: variant !== 'text' ? height : undefined
      } as React.CSSProperties}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton variant="circular" width="3rem" height="3rem" />
        <Skeleton variant="text" width="8rem" />
      </div>
      <SkeletonText lines={4} />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rectangular" width="5rem" height="2rem" />
        <Skeleton variant="rectangular" width="5rem" height="2rem" />
        <Skeleton variant="rectangular" width="5rem" height="2rem" />
      </div>
    </div>
  );
}