'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * System Logs Page (Disabled)
 * Error logging to database has been removed to ensure maximum system stability.
 */
export default function DisabledErrorLogsPage() {
  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border h-10 w-10">
          <Link href="/admin/dashboard"><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">System Logs</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Database Error Capture</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-amber-50 rounded-[2.5rem] border border-amber-100 overflow-hidden">
        <CardContent className="p-16 text-center space-y-6">
          <div className="mx-auto p-6 bg-white rounded-full w-fit shadow-xl text-amber-600">
            <ShieldAlert size={64} />
          </div>
          <div className="space-y-3 max-w-lg mx-auto">
            <h2 className="text-2xl font-black uppercase text-amber-900 tracking-tight">Logging Deactivated</h2>
            <p className="text-sm text-amber-800/70 leading-relaxed font-medium">
              Real-time error logging to Firestore has been disabled to prevent recursive loops and transport assertion failures (ca9/b815). 
              System errors are now directed to the browser console for developer inspection.
            </p>
          </div>
          <Button asChild className="rounded-xl font-bold px-10 h-12 bg-amber-600 hover:bg-amber-700 shadow-lg">
            <Link href="/admin/dashboard">Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
