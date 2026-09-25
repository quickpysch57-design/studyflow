import { create } from 'zustand';
import { Toast, Toaster } from 'react-hot-toast';

interface ToastState {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'loading' | 'custom';
    duration?: number;
  }>;
  addToast: (toast: Omit<ToastState['toasts'][0], 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  loading: (message: string) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { ...toast, id }] });
    if (toast.duration !== 0) {
      setTimeout(() => get().removeToast(id), toast.duration || 4000);
    }
    return id;
  },
  removeToast: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
  success: (message, duration) => get().addToast({ message, type: 'success', duration }),
  error: (message, duration) => get().addToast({ message, type: 'error', duration }),
  loading: (message) => get().addToast({ message, type: 'loading', duration: 0 }),
  dismiss: (id) => get().removeToast(id)
}));

export function toast(message: string, options?: { type?: 'success' | 'error' | 'loading'; duration?: number }) {
  const { success, error, loading } = useToastStore.getState();
  switch (options?.type) {
    case 'success': return success(message, options.duration);
    case 'error': return error(message, options.duration);
    case 'loading': return loading(message);
    default: return success(message, options?.duration);
  }
}

toast.success = (message: string, duration?: number) => useToastStore.getState().success(message, duration);
toast.error = (message: string, duration?: number) => useToastStore.getState().error(message, duration);
toast.loading = (message: string) => useToastStore.getState().loading(message);
toast.dismiss = (id: string) => useToastStore.getState().dismiss(id);

export function ToastContainer() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(24px)'
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#f8fafc'
          }
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#f8fafc'
          }
        },
        loading: {
          iconTheme: {
            primary: '#6366f1',
            secondary: '#f8fafc'
          }
        }
      }}
    />
  );
}