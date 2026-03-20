
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
  Truck,
  ShieldAlert
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

export default function ReportsPage() {
  const db = useFirestore();
  const ordersRef = useMemoFirebase(() => db ? collection(db, 'orders') : null, [db]);
  const { data: orders, isLoading } = useCollection(ordersRef);

  const courierStats = useMemo(() => {
    if (!orders) return [];
    const stats: Record<string, any> = {};
    
    orders.forEach(order => {
      const courier = order.courierName || 'Unassigned';
      if (!stats[courier]) {
        stats[courier] = { name: courier, total: 0, delivered: 0, cancelled: 0, pending: 0 };
      }
      stats[courier].total += 1;
      if (order.status === 'Delivered') stats[courier].delivered += 1;
      if (order.status === 'Cancelled') stats[courier].cancelled += 1;
      if (order.status === 'New' || order.status === 'Processing') stats[courier].pending += 1;
    });
    
    return Object.values(stats);
  }, [orders]);

  const fraudStats = useMemo(() => {
    if (!orders) return { high: 0, suspicious: 0 };
    return {
      high: orders.filter(o => o.riskLevel === 'High').length,
      suspicious: orders.filter(o => o.isSuspicious).length
    };
  }, [orders]);

  return (
    <div className="p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Intelligence</h1>
          <p className="text-muted-foreground text-sm">Combined Courier Performance & Risk Insights</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold"><Download size={18} /> Export Analytics</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Revenue Insight</p>
                   <h3 className="text-2xl font-black mt-1">৳{(orders?.reduce((acc, o) => acc + (o.totalPrice || 0), 0) || 0).toLocaleString()}</h3>
                   <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1"><ArrowUpRight size={14} /> Total Lifetime Sales</p>
                </div>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
             </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50 border border-red-100">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-red-700 uppercase">Fraud Prevention</p>
                   <h3 className="text-2xl font-black mt-1 text-red-900">{fraudStats.suspicious} Blocked</h3>
                   <p className="text-[10px] text-red-600 font-bold mt-2 flex items-center gap-1"><ShieldAlert size={14} /> {fraudStats.high} High-Risk Detected</p>
                </div>
                <div className="p-2 bg-white rounded-lg text-red-600"><ShieldAlert size={20} /></div>
             </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Logistic Coverage</p>
                   <h3 className="text-2xl font-black mt-1">{courierStats.length} Providers</h3>
                   <p className="text-[10px] text-blue-600 font-bold mt-2 flex items-center gap-1"><Truck size={14} /> Multi-Courier Sync Active</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Truck size={20} /></div>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-gray-50/50 border-b">
           <CardTitle className="text-base font-black uppercase tracking-tight">Logistics Success Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                   <TableHead className="font-bold py-4 pl-8 uppercase text-[10px]">Courier Partner</TableHead>
                   <TableHead className="font-bold uppercase text-[10px]">Volume</TableHead>
                   <TableHead className="font-bold uppercase text-[10px]">Delivered</TableHead>
                   <TableHead className="font-bold uppercase text-[10px]">Cancelled</TableHead>
                   <TableHead className="font-bold uppercase text-[10px]">Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {courierStats.map((stat, i) => (
                   <TableRow key={i} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-bold text-gray-900 py-4 pl-8 uppercase text-xs">{stat.name}</TableCell>
                      <TableCell className="font-medium">{stat.total}</TableCell>
                      <TableCell className="text-green-600 font-bold">{stat.delivered}</TableCell>
                      <TableCell className="text-red-600 font-bold">{stat.cancelled}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-50 text-blue-700 border-none font-black text-[10px]">
                          {stat.total > 0 ? Math.round((stat.delivered / stat.total) * 100) : 0}%
                        </Badge>
                      </TableCell>
                   </TableRow>
                 ))}
                 {courierStats.length === 0 && (
                   <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Syncing logistic data...</TableCell></TableRow>
                 )}
              </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
