'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
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
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  Wallet,
  ArrowDownRight,
  TrendingDown,
  PieChart,
  Filter,
  Loader2,
  FileText,
  Zap,
  Briefcase,
  Users
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

export default function FinancialReportPage() {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  const ledgerQuery = useMemoFirebase(() => db ? query(collection(db, 'finance_ledger'), orderBy('date', 'desc')) : null, [db]);
  const accountsQuery = useMemoFirebase(() => db ? collection(db, 'finance_accounts') : null, [db]);
  
  const { data: ledger, isLoading: lLoading } = useCollection(ledgerQuery);
  const { data: accounts, isLoading: aLoading } = useCollection(accountsQuery);

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

    return { income, expense, profit: income - expense, unpaid, salary, commission, projectCost };
  }, [filteredLedger]);

  const chartData = useMemo(() => {
    return [
      { name: 'Income', value: metrics.income, color: '#22c55e' },
      { name: 'Expenses', value: metrics.expense, color: '#ef4444' },
      { name: 'Payroll', value: metrics.salary, color: '#3b82f6' },
      { name: 'Commission', value: metrics.commission, color: '#f59e0b' },
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

  if (lLoading || aLoading || !mounted) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" size={40} /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Financial Report</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Audit-ready income, expense and profit analysis</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-white border rounded-xl p-1 gap-2">
            <Input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="h-9 border-none bg-transparent text-[10px] w-32" />
            <span className="flex items-center text-gray-300">to</span>
            <Input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="h-9 border-none bg-transparent text-[10px] w-32" />
          </div>
          <Button onClick={exportCSV} variant="outline" className="rounded-xl font-bold h-11 border-gray-200 gap-2"><Download size={16} /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-emerald-50 text-emerald-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
              <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px]">INCOME</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Total Collections</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.income.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-rose-50 text-rose-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><TrendingDown size={24} /></div>
              <Badge className="bg-rose-100 text-rose-700 border-none font-black text-[10px]">EXPENSE</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Total Burn</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.expense.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-primary text-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Zap size={24} fill="currentColor" /></div>
              <Badge className="bg-white/20 text-white border-none font-black text-[10px]">NET PROFIT</Badge>
            </div>
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">Business Margin</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.profit.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-amber-50 text-amber-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><FileText size={24} /></div>
              <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[10px]">PENDING</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Unpaid Balance</p>
            <h3 className="text-3xl font-black tracking-tight">৳{metrics.unpaid.toLocaleString()}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold">Category Distribution</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold text-primary">Volume by transaction category</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-base font-bold uppercase tracking-widest flex items-center gap-2"><List size={18} className="text-primary"/> Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow>
                    <TableHead className="pl-8 py-5 font-bold uppercase text-[9px] tracking-widest">Timeline</TableHead>
                    <TableHead className="font-bold uppercase text-[9px] tracking-widest">Category</TableHead>
                    <TableHead className="font-bold uppercase text-[9px] tracking-widest">Amount</TableHead>
                    <TableHead className="font-bold uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLedger.slice(0, 15).map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="pl-8 py-4">
                        <div className="text-[10px] font-bold text-gray-400">{format(parseISO(item.date), 'MMM dd, yyyy')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-black text-gray-900 uppercase text-[10px]">{item.category}</div>
                        <div className="text-[9px] text-muted-foreground truncate max-w-[150px]">{item.notes}</div>
                      </TableCell>
                      <TableCell>
                        <div className={cn("font-black text-xs", item.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                          {item.type === 'income' ? '+' : '-'}৳{item.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-[7px] font-black uppercase border-none px-2", item.paidStatus === 'Paid' ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
                          {item.paidStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                { label: "Partner Commission", val: metrics.commission, icon: Briefcase, color: "text-amber-400" },
                { label: "Direct Project Cost", val: metrics.projectCost, icon: Package, color: "text-indigo-400" },
                { label: "Misc Expenses", val: metrics.expense - (metrics.salary + metrics.commission + metrics.projectCost), icon: TrendingDown, color: "text-rose-400" }
              ].map((kpi, i) => (
                <div key={i} className="flex justify-between items-end border-b border-white/5 pb-4 last:border-none">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-white/40">{kpi.label}</p>
                    <div className="flex items-center gap-2">
                      <kpi.icon size={12} className={kpi.color} />
                      <span className="text-lg font-black tracking-tight">৳{Math.max(0, kpi.val).toLocaleString()}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black">{Math.round((kpi.val / (metrics.expense || 1)) * 100)}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2"><Wallet size={18} className="text-primary" /> Liquidity Pool</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {accounts?.map(acc => (
                <div key={acc.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-all">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase text-gray-400">{acc.name}</p>
                    <p className="text-sm font-black text-gray-900">৳{acc.balance.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl shadow-sm text-primary opacity-40 group-hover:opacity-100"><ArrowUpRight size={14}/></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
