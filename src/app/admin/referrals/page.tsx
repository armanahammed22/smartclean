
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, Users, Wallet, TrendingUp, ArrowRight, Loader2, Award } from 'lucide-react';
import { format } from 'date-fns';

export default function ReferralsManagementPage() {
  const db = useFirestore();

  const referralsQuery = useMemoFirebase(() => db ? query(collection(db, 'referrals'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: referrals, isLoading } = useCollection(referralsQuery);

  const stats = {
    totalReferrals: referrals?.length || 0,
    totalCommission: referrals?.reduce((acc, r) => acc + (r.commissionAmount || 0), 0) || 0,
    activePartners: new Set(referrals?.map(r => r.referrerId)).size
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>
          <p className="text-muted-foreground text-sm">Monitor referral growth and partner commissions</p>
        </div>
        <Button className="gap-2 font-bold shadow-lg h-11"><Award size={18} /> Payout Settings</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase">Total Referrals</p>
              <h3 className="text-3xl font-black mt-1">{stats.totalReferrals}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Share2 size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase">Total Commissions</p>
              <h3 className="text-3xl font-black mt-1">৳{stats.totalCommission.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Wallet size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase">Active Partners</p>
              <h3 className="text-3xl font-black mt-1">{stats.activePartners}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl"><Users size={24} /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Referral Log</CardTitle>
          <TrendingUp className="text-primary" size={20} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Referrer</TableHead>
                <TableHead className="font-bold">New Customer</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Commission</TableHead>
                <TableHead className="font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline mr-2" /> Loading stats...</TableCell></TableRow>
              ) : referrals?.length ? (
                referrals.map((ref) => (
                  <TableRow key={ref.id} className="hover:bg-gray-50/50">
                    <TableCell className="py-4">
                      <div className="font-bold text-xs uppercase text-primary">ID: {ref.referrerId.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{ref.customerName || 'Direct Sign-up'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">{format(new Date(ref.createdAt), 'MMM dd, yyyy')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-black text-primary">৳{ref.commissionAmount || 0}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase border-green-200 bg-green-50 text-green-700">
                        {ref.status || 'Verified'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">No referral activity recorded yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
