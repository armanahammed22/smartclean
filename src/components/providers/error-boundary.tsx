
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Global React Error Boundary
 * Prevents white-screen-of-death. Database logging has been removed for stability.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log to console now
    console.error('[Fatal UI Crash]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-sm">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Oops! Something went wrong</h1>
              <p className="text-gray-500 font-medium">
                The application encountered an unexpected error. Please refresh the page to continue.
              </p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="rounded-full px-10 h-12 font-black uppercase tracking-widest gap-2 shadow-xl"
            >
              <RefreshCcw size={18} /> Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
