'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  Loader2, 
  Megaphone,
  ArrowRight,
  Timer
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CampaignsAdminPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: campaigns, isLoading } = useCollection(campaignsQuery);

  const handleCreate = async () => {
    if (!db) return;
    setIsSubmitting(true);
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 7);

    try {
      await addDoc(collection(db, 'campaigns'), {
        title: 'New Campaign Event',
        slug: 'sale-' + Date.now(),
        bannerImage: 'https://picsum.photos/seed/campaign/1200/400',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        isActive: false,
        priority: 0,
        description: 'New seasonal mega sale events.',
        themeColor: '#EF4444',
        createdAt: new Date().toISOString()
      });
      toast({ title: "Campaign Skeleton Created", description: "Click edit to configure products and dates." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error creating campaign" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'campaigns', id), { isActive: !current });
    toast({ title: "Campaign Status Updated" });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this campaign?")) return;
    await deleteDoc(doc(db, 'campaigns', id));
    toast({ title: "Campaign Removed" });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage Daraz-style Mega Sale events</p>
        </div>
        <Button onClick={handleCreate} disabled={isSubmitting} className="gap-2 font-bold h-11 shadow-lg bg-red-600 hover:bg-red-700 text-white">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
          New Mega Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-red-50 text-red-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-red-700/80 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Active Events</p>
              <h3 className="text-3xl font-black">{campaigns?.filter(c => c.isActive).length || 0}</h3>
            </div>
            <Megaphone size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50 text-blue-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-blue-700/80 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Upcoming</p>
              <h3 className="text-3xl font-black">{campaigns?.filter(c => !c.isActive).length || 0}</h3>
            </div>
            <Calendar size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Lifetime Events</p>
              <h3 className="text-3xl font-black">{campaigns?.length || 0}</h3>
            </div>
            <Zap size={40} className="opacity-20 text-red-500" fill="currentColor" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Event Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Timing</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : campaigns?.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border shrink-0">
                        <Image src={c.bannerImage} alt={c.title} fill className="object-cover" unoptimized />
                      </div>
                      <div>
                        <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{c.title}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">/{c.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
                        <Timer size={12} className="text-red-500" /> {format(new Date(c.startDate), 'MMM dd, HH:mm')}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                        <ArrowRight size={12} /> {format(new Date(c.endDate), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "text-[9px] font-black border-none uppercase px-2 py-0.5 rounded-md",
                      c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {c.isActive ? 'LIVE' : 'DRAFT'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" asChild>
                        <Link href={`/admin/campaigns/${c.id}`}>
                          <Edit size={16} />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleToggle(c.id, c.isActive)}>
                        <Zap size={16} fill={c.isActive ? 'currentColor' : 'none'} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!campaigns?.length && !isLoading && (
                <TableRow><TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic font-medium">No sales events configured. Start by creating a New Mega Sale.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
