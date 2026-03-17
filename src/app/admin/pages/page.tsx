'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Loader2, 
  Search,
  Globe,
  Settings2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function PagesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const pagesQuery = useMemoFirebase(() => db ? query(collection(db, 'pages_management'), orderBy('slug', 'asc')) : null, [db]);
  const { data: pages, isLoading } = useCollection(pagesQuery);

  const filtered = pages?.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this page? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'pages_management', id));
      toast({ title: "Page Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error deleting page" });
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'pages_management', id), { isPublished: !current });
      toast({ title: !current ? "Page Published" : "Page Unpulished" });
    } catch (e) {
      toast({ variant: "destructive", title: "Status Update Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Pages Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Control dynamic content and legal policies</p>
        </div>
        <Button asChild className="gap-2 font-bold h-11 px-6 rounded-xl shadow-lg">
          <Link href="/admin/pages/new">
            <Plus size={18} /> Create New Page
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by title or slug..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Page Title</TableHead>
                <TableHead className="font-bold">Slug / URL</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Last Updated</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered?.length ? (
                filtered.map((page) => (
                  <TableRow key={page.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 rounded-xl text-primary"><FileText size={20} /></div>
                        <span className="font-bold text-gray-900 uppercase text-xs">{page.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">/page/{page.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(
                        "text-[9px] font-black uppercase border-none px-2.5 py-1 rounded-full",
                        page.isPublished ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {page.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-bold">
                      {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50" asChild>
                          <Link href={`/page/${page.slug}`} target="_blank">
                            <Eye size={16} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5" asChild>
                          <Link href={`/admin/pages/${page.id}`}>
                            <Edit size={16} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(page.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">No pages found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
