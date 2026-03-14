'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const REPORT_DATA = [
  { date: '2026-01-01', sales: 4000, revenue: 2400 },
  { date: '2026-01-02', sales: 3000, revenue: 1398 },
  { date: '2026-01-03', sales: 2000, revenue: 9800 },
  { date: '2026-01-04', sales: 2780, revenue: 3908 },
  { date: '2026-01-05', sales: 1890, revenue: 4800 },
  { date: '2026-01-06', sales: 2390, revenue: 3800 },
  { date: '2026-01-07', sales: 3490, revenue: 4300 },
];

export default function ReportsPage() {
  return (
    <div className="p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Financials</h1>
          <p className="text-muted-foreground text-sm">Deep insights into business performance</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold"><Download size={18} /> Export CSV</Button>
           <Button className="gap-2 font-bold"><Calendar size={18} /> Jan 2026 - Dec 2026</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Net Revenue</p>
                   <h3 className="text-2xl font-black mt-1">৳1,42,500</h3>
                   <div className="flex items-center gap-1 text-green-600 text-xs font-bold mt-2">
                      <ArrowUpRight size={14} /> 12.5% from last month
                   </div>
                </div>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
             </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Ad Spend / Marketing</p>
                   <h3 className="text-2xl font-black mt-1">৳42,000</h3>
                   <div className="flex items-center gap-1 text-red-600 text-xs font-bold mt-2">
                      <ArrowDownRight size={14} /> 8.2% vs budget
                   </div>
                </div>
                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><BarChart3 size={20} /></div>
             </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Gross Margin</p>
                   <h3 className="text-2xl font-black mt-1">64.5%</h3>
                   <div className="flex items-center gap-1 text-green-600 text-xs font-bold mt-2">
                      <ArrowUpRight size={14} /> Healthy Performance
                   </div>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Filter size={20} /></div>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
           <CardTitle className="text-lg font-bold">Sales Volume Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REPORT_DATA}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2263C0" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2263C0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} tickFormatter={(val) => val.split('-')[2]} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#2263C0" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
              </AreaChart>
           </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader>
           <CardTitle className="text-lg font-bold">Product Performance Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                   <TableHead className="font-bold py-4">Product Name</TableHead>
                   <TableHead className="font-bold">Quantity Sold</TableHead>
                   <TableHead className="font-bold">Revenue Generated</TableHead>
                   <TableHead className="font-bold">Inventory Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 <TableRow>
                    <TableCell className="font-bold">Smart Vacuum Robot</TableCell>
                    <TableCell>124</TableCell>
                    <TableCell className="font-black text-primary">৳61,99,876</TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-700 border-none font-bold text-[10px]">IN STOCK (12)</Badge></TableCell>
                 </TableRow>
                 <TableRow>
                    <TableCell className="font-bold">Eco Cleaning Kit</TableCell>
                    <TableCell>842</TableCell>
                    <TableCell className="font-black text-primary">৳37,89,000</TableCell>
                    <TableCell><Badge className="bg-red-100 text-red-700 border-none font-bold text-[10px]">LOW STOCK (4)</Badge></TableCell>
                 </TableRow>
              </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
