// Toast context plus the consumer-facing useToast hook. This module is kept
// component-free (it creates the context and exports a hook) so the provider
// module that exports ToastProvider stays a clean fast-refresh boundary.

import { type Context, createContext, useContext } from 'react';

import { type ToastContextValue } from './Toast.types';

// Null default so useToast can detect use outside a provider and fail loudly
// rather than silently no-op.
export const ToastContext: Context<ToastContextValue | null> =
    createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const value: ToastContextValue | null = useContext(ToastContext);
    if (value === null) {
        throw new Error('useToast must be used within a ToastProvider.');
    }
    return value;
}
