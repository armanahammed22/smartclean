'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, addDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Loader2, 
  ArrowLeft, 
  TrendingUp,
  Target,
  ArrowRight,
  Zap,
  Box,
  Wrench,
  Users
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ProjectCostingPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const ledgerQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'finance_ledger'), where('category', '==', 'Project Cost'), orderBy('date', 'desc')) : null, [db]);
  const { data: costs, isLoading } = useCollection(ledgerQuery);

  const bookingsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'bookings'), where('status', '==', 'Completed'), limit(20)) : null, [db]);
  const { data: projects } = useCollection(bookingsQuery);

  const stats = useMemo(() => {
    return {
      active: projects?.length || 0,
      totalSpent: costs?.reduce((a,c) => a + (c.amount || 0), 0) || 0,
      avgProfit: 45 // Mock
    };
  }, [projects, costs]);

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border h-10 w-10" asChild>
            <Link href="/admin/finance"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Project Costing</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Per-Service Profit Analysis</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Active Projects</p>
              <h3 className="text-3xl font-black text-gray-900">{stats.active}</h3>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Target size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Project Cost</p>
              <h3 className="text-3xl font-black text-rose-600">৳{stats.totalSpent.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><TrendingUp size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between h-full">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Avg Profit Margin</p>
              <h3 className="text-3xl font-black">{stats.avgProfit}%</h3>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl text-primary"><Zap size={24} fill="currentColor"/></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {projects?.map((p) => (
          <Card key={p.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/5 text-primary rounded-3xl group-hover:scale-110 transition-transform"><Wrench size={28}/></div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{p.serviceTitle}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">ORDER: #{p.id.slice(0, 8)} • CLIENT: {p.customerName}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Revenue</p>
                    <p className="text-2xl font-black text-emerald-600">৳{p.totalPrice?.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-100 mx-2" />
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Est. Profit</p>
                    <p className="text-2xl font-black text-primary">৳{(p.totalPrice * 0.4).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Staff Wages", val: "৳1,200", icon: Users, color: "text-blue-600" },
                  { label: "Materials", val: "৳450", icon: Box, color: "text-orange-600" },
                  { label: "Transport", val: "৳200", icon: TrendingUp, color: "text-purple-600" },
                  { label: "Commission", val: "৳150", icon: DollarSign, color: "text-emerald-600" }
                ].map((cost, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <cost.icon size={14} className={cost.color}/>
                      <span className="text-[9px] font-black uppercase text-muted-foreground">{cost.label}</span>
                    </div>
                    <p className="text-sm font-black text-gray-900">{cost.val}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
