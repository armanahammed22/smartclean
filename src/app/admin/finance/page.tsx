'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Zap,
  Building2,
  PieChart,
  Target
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { startOfMonth, startOfDay, isAfter, parseISO } from 'date-fns';

export default function FinanceDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const [range, setRange] = useState<'today' | 'month' | 'all'>('month');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ledgerQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'finance_ledger'), orderBy('date', 'desc')) : null, [db, user]);
  const { data: ledger, isLoading: lLoading } = useCollection(ledgerQuery);

  const accountsQuery = useMemoFirebase(() => 
    (db && user) ? collection(db, 'finance_accounts') : null, [db, user]);
  const { data: accounts } = useCollection(accountsQuery);

  const metrics = useMemo(() => {
    if (!ledger) return { income: 0, expense: 0, profit: 0, unpaid: 0, count: 0 };
    
    const now = new Date();
    const start = range === 'today' ? startOfDay(now) : range === 'month' ? startOfMonth(now) : null;

    const filtered = start ? ledger.filter(l => isAfter(parseISO(l.date), start)) : ledger;

    const income = filtered.filter(l => l.type === 'income' && l.paidStatus === 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const expense = filtered.filter(l => l.type === 'expense' && l.paidStatus === 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const unpaid = filtered.filter(l => l.paidStatus === 'Unpaid').reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return { income, expense, profit: income - expense, unpaid, count: filtered.length };
  }, [ledger, range]);

  const chartData = [
    { name: 'Mon', inc: 4000, exp: 2400 },
    { name: 'Tue', inc: 3000, exp: 1398 },
    { name: 'Wed', inc: 2000, exp: 9800 },
    { name: 'Thu', inc: 2780, exp: 3908 },
    { name: 'Fri', inc: 1890, exp: 4800 },
    { name: 'Sat', inc: 2390, exp: 3800 },
    { name: 'Sun', inc: 3490, exp: 4300 },
  ];

  const totalBalance = accounts?.reduce((acc, a) => acc + (a.balance || 0), 0) || 0;

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Financial Hub</h1>
          <p className="text-muted-foreground text-sm font-medium">Real-time consolidated business accounts & reporting</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <Button variant="ghost" size="sm" onClick={() => setRange('today')} className={cn("text-[10px] font-black uppercase rounded-lg px-4", range === 'today' ? "bg-primary text-white" : "text-gray-400")}>Today</Button>
          <Button variant="ghost" size="sm" onClick={() => setRange('month')} className={cn("text-[10px] font-black uppercase rounded-lg px-4", range === 'month' ? "bg-primary text-white" : "text-gray-400")}>Month</Button>
          <Button variant="ghost" size="sm" onClick={() => setRange('all')} className={cn("text-[10px] font-black uppercase rounded-lg px-4", range === 'all' ? "bg-primary text-white" : "text-gray-400")}>All</Button>
        </div>
      </div>

      {/* 📊 Balance & Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group border border-gray-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><Wallet size={24} /></div>
              <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[8px] px-2 py-0.5">NET CASH</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Liquid Capital</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tighter">৳{totalBalance.toLocaleString()}</h3>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-emerald-50 text-emerald-700 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm"><TrendingUp size={24} /></div>
            </div>
            <p className="text-[10px] font-black uppercase text-emerald-700/60 tracking-widest leading-none mb-1">Collections</p>
            <h3 className="text-3xl font-black tracking-tighter">৳{metrics.income.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-rose-50 text-rose-700 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm"><TrendingDown size={24} /></div>
            </div>
            <p className="text-[10px] font-black uppercase text-rose-700/60 tracking-widest leading-none mb-1">Expenditures</p>
            <h3 className="text-3xl font-black tracking-tighter">৳{metrics.expense.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden text-white", metrics.profit >= 0 ? "bg-[#081621]" : "bg-red-600")}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform text-primary"><Zap size={24} fill="currentColor" /></div>
              <Badge className="bg-white/20 text-white border-none font-black text-[8px] px-2 py-0.5 uppercase">Business Margin</Badge>
            </div>
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">Net Earnings</p>
            <h3 className="text-3xl font-black tracking-tighter">৳{metrics.profit.toLocaleString()}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Graph Card */}
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Transaction Trends</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black tracking-widest text-primary">Consolidated cash flow analysis</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 rounded-xl font-black uppercase text-[10px] text-primary" asChild>
                  <Link href="/admin/finance/ledger">Audit Ledger <ArrowRight size={14} className="ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E5F7A" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#1E5F7A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="inc" stroke="#1E5F7A" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="exp" stroke="#ef4444" strokeWidth={4} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-gray-100">
              <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2"><Target size={18} className="text-primary" /> Multi-Partner Commissions</CardTitle>
                <Link href="/admin/partners/commissions" className="text-[9px] font-black uppercase text-primary hover:underline">Audits</Link>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400">Total Partner Payouts</p>
                    <p className="text-xl font-black text-rose-600">৳{ledger?.filter(l => l.category === 'Partner Commission').reduce((a,c) => a + (c.amount || 0), 0).toLocaleString()}</p>
                  </div>
                  <Badge className="bg-rose-50 text-rose-700 border-none">PAYABLE</Badge>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400">Income from Partners</p>
                    <p className="text-xl font-black text-emerald-600">৳{ledger?.filter(l => l.category === 'Partner Commission' && l.type === 'income').reduce((a,c) => a + (c.amount || 0), 0).toLocaleString()}</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-none">RECEIVABLE</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-gray-100">
              <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2"><Users size={18} className="text-primary" /> Internal Workforce</CardTitle>
                <Link href="/admin/finance/salaries" className="text-[9px] font-black uppercase text-primary hover:underline">Payroll</Link>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-1 mb-4">
                  <p className="text-[10px] font-black uppercase text-gray-400">Salary Disbursements</p>
                  <p className="text-xl font-black text-gray-900">৳{ledger?.filter(l => l.category === 'Staff Salary' && l.paidStatus === 'Paid').reduce((a,c) => a + (c.amount || 0), 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-gray-400">Current Unpaid</span>
                  <span className="text-sm font-black text-rose-600">৳{ledger?.filter(l => l.category === 'Staff Salary' && l.paidStatus === 'Unpaid').reduce((a,c) => a + (c.amount || 0), 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 🏦 ACCOUNTS SIDEBAR */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Building2 size={120} /></div>
            <CardHeader className="relative z-10 p-8 pb-4">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center justify-between">
                <span>Account Registry</span>
                <Link href="/admin/finance/accounts"><Badge className="bg-primary/20 text-primary border-none cursor-pointer hover:bg-primary/30">Manage</Badge></Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-8 pt-0 space-y-4">
              {accounts?.map(acc => (
                <div key={acc.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md flex justify-between items-center group hover:bg-white/10 transition-all">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-40">{acc.name}</p>
                    <p className="text-lg font-black tracking-tight">৳{acc.balance?.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-primary/20 text-primary rounded-xl group-hover:scale-110 transition-transform"><Wallet size={16}/></div>
                </div>
              ))}
              {accounts?.length === 0 && <p className="text-center py-10 text-[10px] font-black uppercase opacity-20">No accounts linked</p>}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-gray-100">
            <CardHeader className="p-8 pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ClipboardList size={16} /> Latest Audit Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
              {ledger?.slice(0, 6).map(item => (
                <div key={item.id} className="flex items-center justify-between group border-b border-gray-50 pb-3 last:border-none">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", item.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                      {item.type === 'income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-900 tracking-tight leading-none mb-1">{item.category}</p>
                      <p className="text-[8px] text-muted-foreground font-black uppercase">{item.paidStatus}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-black", item.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                      {item.type === 'income' ? '+' : '-'}৳{item.amount.toLocaleString()}
                    </p>
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
