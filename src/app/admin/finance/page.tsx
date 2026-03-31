'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  BarChart3, 
  DollarSign, 
  Users, 
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Zap
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
import { format, startOfMonth, startOfDay, isAfter, parseISO } from 'date-fns';

export default function FinanceDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const [range, setRange] = useState<'today' | 'month' | 'all'>('month');

  // Ledger query - ensured user check
  const ledgerQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'finance_ledger'), orderBy('date', 'desc')) : null, [db, user]);
  const { data: ledger, isLoading: lLoading } = useCollection(ledgerQuery);

  // Accounts query - ensured user check
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

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Financial Hub</h1>
          <p className="text-muted-foreground text-sm font-medium">Real-time business accounts and ledger analytics</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <Button variant="ghost" size="sm" onClick={() => setRange('today')} className={cn("text-[10px] font-black uppercase rounded-lg px-4", range === 'today' ? "bg-primary text-white" : "text-gray-400")}>Today</Button>
          <Button variant="ghost" size="sm" onClick={() => setRange('month')} className={cn("text-[10px] font-black uppercase rounded-lg px-4", range === 'month' ? "bg-primary text-white" : "text-gray-400")}>This Month</Button>
          <Button variant="ghost" size="sm" onClick={() => setRange('all')} className={cn("text-[10px] font-black uppercase rounded-lg px-4", range === 'all' ? "bg-primary text-white" : "text-gray-400")}>All Time</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><Wallet size={24} /></div>
              <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[10px]">REAL TIME</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Total Balance</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">৳{totalBalance.toLocaleString()}</h3>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-emerald-50 text-emerald-700 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm"><ArrowUpRight size={24} /></div>
            </div>
            <p className="text-[10px] font-black uppercase text-emerald-700/60 tracking-widest leading-none mb-1">Total Income</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.income.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-rose-50 text-rose-700 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm"><ArrowDownRight size={24} /></div>
            </div>
            <p className="text-[10px] font-black uppercase text-rose-700/60 tracking-widest leading-none mb-1">Total Expense</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.expense.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden text-white", metrics.profit >= 0 ? "bg-primary" : "bg-red-600")}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Zap size={24} fill="currentColor" /></div>
              <Badge className="bg-white/20 text-white border-none font-black text-[10px]">NET PROFIT</Badge>
            </div>
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">Business Margin</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.profit.toLocaleString()}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Transaction Trends</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black tracking-widest text-primary">Income vs Expense flow</CardDescription>
              </div>
              <Button variant="ghost" className="text-xs font-black uppercase text-primary gap-2" asChild>
                <Link href="/admin/finance/ledger">View Ledger <ArrowRight size={14}/></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2263C0" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2263C0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="inc" stroke="#2263C0" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="exp" stroke="#ef4444" strokeWidth={4} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2"><Users size={18} className="text-primary" /> Payroll Status</CardTitle>
                <Link href="/admin/finance/salaries" className="text-[10px] font-black uppercase text-primary">Manage</Link>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Unpaid Salaries</p>
                    <p className="text-2xl font-black text-rose-600">৳{ledger?.filter(l => l.category === 'Staff Salary' && l.paidStatus === 'Unpaid').reduce((a,c) => a + (c.amount || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Total Paid (This Month)</p>
                    <p className="text-sm font-bold text-gray-900">৳45,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2"><Layers size={18} className="text-primary" /> Project Costs</CardTitle>
                <Link href="/admin/finance/projects" className="text-[10px] font-black uppercase text-primary">Details</Link>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Operating Costs</p>
                    <p className="text-2xl font-black text-indigo-600">৳{ledger?.filter(l => l.category === 'Project Cost').reduce((a,c) => a + (c.amount || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-50 text-emerald-700 border-none">Healthy Margin</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><DollarSign size={120} /></div>
            <CardHeader className="relative z-10 p-8 pb-4">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Accounts Registry</CardTitle>
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
              <Button asChild variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 h-12 rounded-xl uppercase text-[10px] font-black tracking-widest">
                <Link href="/admin/finance/accounts">Manage Accounts</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ClipboardList size={16} /> Recent Ledger Entries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
              {lLoading ? <Loader2 className="animate-spin text-primary mx-auto"/> : ledger?.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", item.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                      {item.type === 'income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-gray-900 tracking-tight leading-none mb-1">{item.category}</p>
                      <p className="text-[9px] text-muted-foreground font-bold">{format(parseISO(item.date), 'MMM dd')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-black", item.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                      {item.type === 'income' ? '+' : '-'}৳{item.amount.toLocaleString()}
                    </p>
                    <Badge variant="secondary" className="text-[7px] font-black uppercase p-0 px-1 bg-gray-100">{item.paidStatus}</Badge>
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
