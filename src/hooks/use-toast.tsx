// shadcn UI toast
"use client"
import React, { createContext, useContext, useState } from 'react';
import { Toast } from '@/components/shadcnUI/Toast';
import { Button } from '@/components/shadcnUI/Button';
import { X } from 'lucide-react';
import { ToastAction } from "@/components/shadcnUI/Toast";

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
    variant?: ToastVariant;
    title?: string;
    description?: string;
    duration?: number;
    action?: React.ReactNode;
    altText?: string;
}

interface Toast extends ToastProps {
    id: string;
}

interface ToastContextType {
    toasts: Toast[];
    toast: (props: ToastProps) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = ({
        variant = 'default',
        title,
        description,
        duration = 5000,
        action,
        altText = ""
    }: ToastProps) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, variant, title, description, duration, action, altText };

        setToasts((prevToasts) => [...prevToasts, newToast]);

        if (duration) {
            setTimeout(() => {
                dismiss(id);
            }, duration);
        }
    };

    const dismiss = (id: string) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

function ToastContainer() {
    const { toasts, dismiss } = useToast();

    return (
        <div className="fixed top-0 right-0 p-2 space-y-2 max-w-md z-[999]">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        rounded-md shadow-sm p-4 transition-all duration-300 
                        ${toast.variant === 'destructive' ? 'bg-red-100 text-red-700' : ''}
                        ${toast.variant === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : ''}
                        ${toast.variant === 'default' ? 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200' : ''}
                    `}
                >

                    <div className='flex flex-row justify-between'>
                        {toast.title && <p className="font-medium">{toast.title} </p>}
                        <Button
                            variant="ghost"
                            color="gray"
                            size="icon"
                            onClick={() => dismiss(toast.id)}
                            className="relative top-0 right-1 p-2 w-4 h-4  text-black hover:text-gray-600"
                        >
                            <X size={8} />
                        </Button>
                    </div>
                    <div className="flex flex-row gap-4 items-center">
                        {toast.description && <p className="text-sm">{toast.description}</p>}
                        {toast.action && <ToastAction className="bg-gray-100" altText={toast.altText || ""}>{toast.altText}</ToastAction>}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
}