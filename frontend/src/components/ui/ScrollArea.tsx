import { forwardRef, HTMLAttributes } from 'react';

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`overflow-y-auto scrollbar-hide ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

ScrollArea.displayName = 'ScrollArea';