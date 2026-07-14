'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileCode, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Globe, 
  FileText, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Upload,
  ExternalLink,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DomainVerificationFilesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    filename: '',
    content: '',
  });

  const filesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'verification_files'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: files, isLoading } = useCollection(filesQuery);

  const filtered = files?.filter(f => 
    f.filename?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData({
        filename: file.name,
        content: content
      });
      toast({ title: "File Imported", description: `${file.name} content loaded.` });
    };
    reader.readAsText(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.filename || !formData.content) return;
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        filename: formData.filename.toLowerCase().trim(),
        updatedAt: new Date().toISOString()
      };

      if (editingFile) {
        await updateDoc(doc(db, 'verification_files', editingFile.id), payload);
        toast({ title: "File Updated" });
      } else {
        await addDoc(collection(db, 'verification_files'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Verification File Published" });
      }
      setIsDialogOpen(false);
      setEditingFile(null);
      setFormData({ filename: '', content: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Operation Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this verification file? It will stop working immediately.")) return;
    try {
      await deleteDoc(doc(db, 'verification_files', id));
      toast({ title: "File Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Root Verification Files</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage Google, Meta, and other HTML verification files</p>
        </div>
        <Button onClick={() => { setEditingFile(null); setFormData({ filename: '', content: '' }); setIsDialogOpen(true); }} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> Add New File
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search files by name..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>
        ) : filtered?.map((file) => (
          <Card key={file.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all border border-gray-100">
            <div className="h-1 bg-primary/20 w-full" />
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/5 text-primary rounded-xl">
                    <FileCode size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-900 uppercase text-xs truncate max-w-[150px]">{file.filename}</h3>
                    <p className="text-[9px] font-mono text-muted-foreground mt-1">/{file.filename}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingFile(file); setFormData({ filename: file.filename, content: file.content }); setIsDialogOpen(true); }}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(file.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-mono text-[9px] text-gray-500 overflow-hidden h-16 relative">
                 <div className="line-clamp-3 whitespace-pre-wrap">{file.content}</div>
                 <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent" />
              </div>

              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none font-black text-[8px] uppercase px-2 py-0.5">Live & Active</Badge>
                <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase text-primary gap-1" asChild>
                  <a href={`/${file.filename}`} target="_blank">Test Link <ExternalLink size={12}/></a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!filtered?.length && !isLoading && (
          <div className="col-span-full p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
            <Zap size={48} className="opacity-10" />
            <div className="space-y-1">
              <p className="font-black uppercase text-xs tracking-widest">No Verification Files</p>
              <p className="text-[10px]">Add your Google or Meta HTML files here to verify domain.</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <header className="p-8 bg-[#081621] text-white shrink-0 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-xl shadow-xl"><ShieldCheck size={24}/></div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Verification Protocol</DialogTitle>
              </div>
              <p className="text-white/40 font-bold uppercase text-[9px]">Root Directory File Deployment</p>
            </div>
            <button onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
          </header>
          
          <div className="p-8 space-y-8 bg-white">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">File Name (with extension)</Label>
                  <Input 
                    value={formData.filename} 
                    onChange={e => setFormData({...formData, filename: e.target.value})}
                    placeholder="e.g. google12345.html"
                    className="h-12 bg-gray-50 border-none rounded-xl font-bold font-mono text-sm shadow-inner"
                  />
                </div>
                <div className="relative">
                   <input type="file" id="file-upload" className="hidden" accept=".html" onChange={handleFileImport} />
                   <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 gap-2 text-[10px] font-black uppercase" asChild>
                      <label htmlFor="file-upload" className="cursor-pointer">
                         <Upload size={16}/> Import from local File
                      </label>
                   </Button>
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Raw HTML Content</Label>
                <Textarea 
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder="<html>...</html>"
                  className="min-h-[250px] bg-gray-50 border-none rounded-2xl font-mono text-xs p-6 shadow-inner focus:bg-white transition-all leading-relaxed"
                />
             </div>

             <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm shrink-0 mt-0.5"><Zap size={18}/></div>
                <div className="space-y-1">
                   <h5 className="text-xs font-black uppercase text-blue-900">Automation Bridge</h5>
                   <p className="text-[10px] font-medium text-blue-800/70 leading-relaxed uppercase">
                     এটি সেভ করার পর আপনার ডোমেইনের রুট পাথে (যেমন: smartclean.bd/{formData.filename || 'your-file.html'}) ফাইলটি অটোমেটিক দৃশ্যমান হবে।
                   </p>
                </div>
             </div>
          </div>

          <DialogFooter className="p-8 bg-gray-50 border-t flex flex-col sm:flex-row gap-3 shrink-0">
             <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px] h-12 flex-1">Discard</Button>
             <Button onClick={handleSave} disabled={isSubmitting} className="rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95 text-xs h-12 flex-1">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync to Root</>}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
