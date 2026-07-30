
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Users, 
  X,
  PlusCircle,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export default function TeamManagementListPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const teamQuery = useMemoFirebase(() => 
    db ? collection(db, 'team_members') : null, [db]);
  const { data: teamRaw, isLoading } = useCollection(teamQuery);

  const team = useMemo(() => {
    if (!teamRaw) return [];
    return [...teamRaw].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }, [teamRaw]);

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Permanently remove this team member?")) return;
    try {
      await deleteDoc(doc(db, 'team_members', id));
      toast({ title: "Member Removed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Team Management</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage public profiles for the "Meet Our Team" section</p>
        </div>
        <Button asChild className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Link href="/admin/customize/team/new">
            <Plus size={18} /> Add New Member
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin text-primary inline" size={40} />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Team Registry...</p>
          </div>
        ) : team?.map((member) => (
          <Card key={member.id} className={cn("border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all border border-gray-100", !member.active && "opacity-60 grayscale")}>
            <div className="relative aspect-[4/5] overflow-hidden">
              {member.image ? (
                <Image src={member.image} alt={member.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><Users size={64} /></div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {member.featured && <Badge className="bg-primary text-white border-none uppercase font-black text-[8px] px-2 py-0.5">Featured</Badge>}
                {!member.active && <Badge variant="destructive" className="uppercase font-black text-[8px] px-2 py-0.5">Inactive</Badge>}
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1 text-center">
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-base leading-none">{member.name}</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{member.designation}</p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl font-bold h-9 gap-2 text-[10px] uppercase">
                  <Link href={`/admin/customize/team/${member.id}`}><Edit size={14} /> Edit</Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive rounded-xl hover:bg-red-50" onClick={() => handleDelete(member.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && team.length === 0 && (
        <div className="p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
          <Zap size={48} className="opacity-10" />
          <div className="space-y-1">
            <p className="font-black uppercase text-xs tracking-widest">Team Registry Empty</p>
            <p className="text-[10px]">Add your first team member to show them on the home page.</p>
          </div>
        </div>
      )}
    </div>
  );
}
