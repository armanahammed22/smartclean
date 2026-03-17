
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TestimonialsMigrationPage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Testimonials (Deprecated)</h1>
        <p className="text-muted-foreground text-sm">This module has been moved to the centralized Pages Management system.</p>
      </div>

      <Card className="border-none shadow-sm bg-blue-50 rounded-3xl border border-blue-100">
        <CardContent className="p-10 space-y-6 text-center">
          <div className="mx-auto p-4 bg-white rounded-full w-fit shadow-sm text-blue-600">
            <FileText size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase text-blue-900">Module Relocated</h2>
            <p className="text-sm text-blue-800/70 max-w-md mx-auto">
              Testimonials are now managed as a dynamic page. This provides more flexibility in how you showcase customer feedback.
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
