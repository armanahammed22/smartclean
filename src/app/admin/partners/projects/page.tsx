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
  Activity
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PartnerProjectsListPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const projectsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'partner_projects'), orderBy('createdAt', 'desc')) : null, [db, user]);
  const { data: projects, isLoading } = useCollection(projectsQuery);

  const filtered = useMemo(() => {
    return projects?.filter(p => 
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partnerName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [projects, searchTerm]);

  const stats = useMemo(() => {
    return {
      active: filtered.filter(p => p.status === 'In Progress').length,
      pending: filtered.filter(p => p.status === 'Pending').length,
      completed: filtered.filter(p => p.status === 'Completed').length,
      totalValue: filtered.reduce((a, c) => a + (c.projectAmount || 0), 0)
    };
  }, [filtered]);

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this project permanently?")) return;
    await deleteDoc(doc(db, 'partner_projects', id));
    toast({ title: "Project Removed" });
  };

  const updateStatus = async (id: string, nextStatus: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'partner_projects', id), { 
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });
    toast({ title: `Status: ${nextStatus}` });
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border h-10 w-10" asChild>
            <Link href="/admin/partners"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">B2B Project Desk</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Multi-Partner Resource Management</p>
          </div>
        </div>
        <Button asChild className="rounded-xl font-black h-11 px-6 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
          <Link href="/admin/partners/projects/new"><Plus size={18} /> Plan Project</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active", val: stats.active, icon: Activity, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Pending", val: stats.pending, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Done", val: stats.completed, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Portfolio Value", val: `৳${stats.totalValue.toLocaleString()}`, icon: Briefcase, bg: "bg-indigo-50", color: "text-indigo-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={18} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Filter projects by title or partner name..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest">Project Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Partner & Account</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Resources</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered?.map((proj) => (
                <TableRow key={proj.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/5 text-primary rounded-xl group-hover:scale-110 transition-transform">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{proj.title}</div>
                        <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <MapPin size={10} className="text-primary"/> {proj.workLocation}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-black text-gray-700 uppercase text-[10px]">{proj.partnerName}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-primary">৳{proj.projectAmount?.toLocaleString()}</span>
                        <Badge variant="outline" className={cn(
                          "text-[7px] font-black border-none px-1.5 py-0",
                          proj.commissionDirection === 'TheyGiveMe' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}>{proj.commissionDirection === 'TheyGiveMe' ? 'IN' : 'OUT'}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {proj.staffAssigned?.slice(0, 3).map((s: any, idx: number) => (
                          <div key={idx} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-indigo-600 uppercase" title={s.name}>{s.name[0]}</div>
                        ))}
                        {proj.staffAssigned?.length > 3 && <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-400">+{proj.staffAssigned.length - 3}</div>}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{proj.staffAssigned?.length || 0} Force</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={proj.status} onValueChange={(v) => updateStatus(proj.id, v)}>
                      <SelectTrigger className={cn(
                        "h-8 text-[9px] font-black uppercase w-[110px] border-none shadow-sm",
                        proj.status === 'Pending' ? "bg-amber-50 text-amber-700" :
                        proj.status === 'In Progress' ? "bg-blue-50 text-blue-700" :
                        proj.status === 'Completed' ? "bg-green-50 text-green-700" :
                        "bg-gray-100 text-gray-500"
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-xl hover:bg-red-50" onClick={() => handleDelete(proj.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">No projects assigned yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
