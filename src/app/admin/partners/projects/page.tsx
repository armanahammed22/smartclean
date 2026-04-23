
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Filter, 
  Loader2, 
  ArrowLeft, 
  Briefcase, 
  Calendar, 
  Users, 
  MapPin, 
  Wallet,
  Zap,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  Activity,
  Handshake,
  TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PartnerProjectsListPage() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const projectsQuery = useMemoFirebase(() => 
    (db && !isUserLoading && user) ? query(collection(db, 'partner_projects'), orderBy('createdAt', 'desc')) : null, 
  [db, user, isUserLoading]);
  
  const { data: projects, isLoading } = useCollection(projectsQuery);

  const filtered = useMemo(() => {
    return projects?.filter(p => 
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partnerName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [projects, searchTerm]);

  const stats = useMemo(() => {
    return {
      active: filtered.filter(p => p.status !== 'Completed').length,
      revenue: filtered.reduce((a, c) => a + (c.projectAmount || 0), 0),
      commissions: filtered.reduce((a, c) => a + (c.commissionAmount || 0), 0)
    };
  }, [filtered]);

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this project permanently?")) return;
    await deleteDoc(doc(db, 'partner_projects', id));
    toast({ title: "Project Removed" });
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border h-10 w-10" asChild>
            <Link href="/admin/partners"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Synced B2B Projects</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Real-time automation stream from Operations</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Partner Revenue</p>
              <h3 className="text-2xl font-black text-gray-900">৳{stats.revenue.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between h-full">
            <div>
              <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Our Commissions</p>
              <h3 className="text-2xl font-black text-primary">৳{stats.commissions.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl text-primary"><Zap size={24} fill="currentColor"/></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50 text-emerald-700 rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1">Ongoing Links</p>
              <h3 className="text-2xl font-black">{stats.active} Contracts</h3>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-inner"><Handshake size={24} /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none">
                <TableHead className="py-5 pl-8 font-black uppercase text-[9px] tracking-widest">Partner Identity</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-widest">Project / Site</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-widest text-right">Volume (৳)</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-widest text-right">Commission</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[9px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow> : 
                filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="font-black text-gray-900 text-[11px] uppercase">{p.partnerName}</div>
                      <div className="text-[8px] font-bold text-muted-foreground uppercase mt-1">ID: {p.id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] font-black uppercase text-gray-600 truncate max-w-[200px]">{p.title}</div>
                    </TableCell>
                    <TableCell className="text-right font-black text-gray-900 text-xs">
                      ৳{p.projectAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-black text-indigo-600 text-xs">
                      ৳{p.commissionAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={cn(
                        "text-[8px] font-black uppercase border-none px-2 py-0.5",
                        p.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      )}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild><Link href={`/admin/projects/${p.sourceProjectId || p.id}`}><ChevronRight size={18}/></Link></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
