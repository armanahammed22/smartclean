
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FAQMigrationPage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">FAQ Management (Deprecated)</h1>
        <p className="text-muted-foreground text-sm">This module has been moved to the centralized Pages Management system.</p>
      </div>

      <Card className="border-none shadow-sm bg-amber-50 rounded-3xl border border-amber-100">
        <CardContent className="p-10 space-y-6 text-center">
          <div className="mx-auto p-4 bg-white rounded-full w-fit shadow-sm text-amber-600">
            <FileText size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase text-amber-900">Module Relocated</h2>
            <p className="text-sm text-amber-800/70 max-w-md mx-auto">
              FAQs are now managed as a dynamic page. This allows for better formatting and centralized control of all site content.
            </p>
          </div>
          <Button asChild className="rounded-xl font-bold gap-2 px-8">
            <Link href="/admin/pages">
              Go to Pages Management <ArrowRight size={18} />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
