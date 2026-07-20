'use client';

import React, { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  TrendingUp, 
  Wallet, 
  TrendingDown, 
  PieChart, 
  Loader2, 
  Zap, 
  Briefcase, 
  Users, 
  Layers
} from 'lucide-react';
import { parseISO, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

// 🚀 DYNAMIC IMPORT FOR HEAVY CHARTS
const PerformanceChart = dynamic(() => import('recharts').then((mod) => {
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = mod;
  return function Chart({ data }: { data: any[] }) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}} />
          <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };
}), { 
  ssr: false, 
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-50/50 rounded-2xl"><Loader2 className="animate-spin text-primary/20" /></div> 
});

export default function FinancialReportPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  const ledgerQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'finance_ledger'), orderBy('date', 'desc')) : null, [db, user]);
  
  const { data: ledger, isLoading: lLoading } = useCollection(ledgerQuery);

  const filteredLedger = useMemo(() => {
    if (!ledger) return [];
    if (!dateRange.start || !dateRange.end) return ledger;
    
    return ledger.filter(item => {
      const date = parseISO(item.date);
      return isWithinInterval(date, {
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end)
      });
    });
  }, [ledger, dateRange]);

  const metrics = useMemo(() => {
    const income = filteredLedger.filter(l => l.type === 'income' && l.paidStatus === 'Paid').reduce((acc, c) => acc + (c.amount || 0), 0);
    const expense = filteredLedger.filter(l => l.type === 'expense' && l.paidStatus === 'Paid').reduce((acc, c) => acc + (c.amount || 0), 0);
    const unpaid = filteredLedger.filter(l => l.paidStatus === 'Unpaid').reduce((acc, c) => acc + (c.amount || 0), 0);
    
    const salary = filteredLedger.filter(l => l.category === 'Staff Salary').reduce((acc, c) => acc + (c.amount || 0), 0);
    const commission = filteredLedger.filter(l => l.category === 'Partner Commission').reduce((acc, c) => acc + (c.amount || 0), 0);
    const projectCost = filteredLedger.filter(l => l.category === 'Project Cost').reduce((acc, c) => acc + (c.amount || 0), 0);
    const packageIncome = filteredLedger.filter(l => l.category === 'Package Income').reduce((acc, c) => acc + (c.amount || 0), 0);

    return { income, expense, profit: income - expense, unpaid, salary, commission, projectCost, packageIncome };
  }, [filteredLedger]);

  const chartData = useMemo(() => {
    return [
      { name: 'Income', value: metrics.income, color: '#22c55e' },
      { name: 'Expenses', value: metrics.expense, color: '#ef4444' },
      { name: 'Bundles', value: metrics.packageIncome, color: '#1E5F7A' },
      { name: 'Projects', value: metrics.projectCost, color: '#3b82f6' },
    ];
  }, [metrics]);

  const exportCSV = () => {
    const headers = ["Date", "Category", "Type", "Amount", "Status", "Notes"];
    const rows = filteredLedger.map(l => [l.date, l.category, l.type, l.amount, l.paidStatus, l.notes]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (lLoading || !mounted) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Financial Intelligence</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Consolidated revenue stream including Package sales</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportCSV} variant="outline" className="rounded-xl font-bold h-11 border-gray-200 gap-2"><Download size={16} /> Export Audit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-emerald-50 text-emerald-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm"><TrendingUp size={24} /></div>
              <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px]">TOTAL</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Total Collections</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.income.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-blue-50 text-blue-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm"><Layers size={24} /></div>
              <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[10px]">BUNDLES</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Package Revenue</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.packageIncome.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-primary text-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Zap size={24} fill="currentColor" /></div>
              <Badge className="bg-white/20 text-white border-none font-black text-[10px]">PROFIT</Badge>
            </div>
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">Net Margin</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.profit.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-amber-50 text-amber-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm"><Wallet size={24} /></div>
              <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[10px]">DUE</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Receivables</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.unpaid.toLocaleString()}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold">Revenue Breakdown</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold text-primary">Contribution by service type</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <PerformanceChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><PieChart size={120} /></div>
            <CardHeader className="relative z-10 p-8 pb-4">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-8 pt-0 space-y-6">
              {[
                { label: "Staff Payroll", val: metrics.salary, icon: Users, color: "text-blue-400" },
                { label: "Bundle Sales", val: metrics.packageIncome, icon: Layers, color: "text-indigo-400" },
                { label: "Partner Comm", val: metrics.commission, icon: Briefcase, color: "text-amber-400" },
                { label: "Other OpEx", val: metrics.expense - (metrics.salary + metrics.projectCost), icon: TrendingDown, color: "text-rose-400" }
              ].map((kpi, i) => (
                <div key={i} className="flex justify-between items-end border-b border-white/5 pb-4 last:border-none">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-white/40">{kpi.label}</p>
                    <div className="flex items-center gap-2">
                      <kpi.icon size={12} className={kpi.color} />
                      <span className="text-lg font-black tracking-tight">৳{Math.max(0, kpi.val).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
