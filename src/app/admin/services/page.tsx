"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Save, 
  Layers, 
  Users, 
  Clock, 
  CheckCircle2, 
  X, 
  Settings2, 
  XCircle, 
  Eye, 
  Star,
  Zap,
  Layout,
  Package,
  Search,
  FolderTree
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useLanguage } from '@/components/providers/language-provider';

export default function ServicesManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingService, setViewingService] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [mainImageUrl, setMainImageUrl] = useState('');
  
  // Taxonomy States
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>('');

  const [newServiceData, setNewServiceData] = useState({
    title: '',
    basePrice: '',
    duration: '2-4 Hours',
    teamSize: '2 Persons',
    badgeText: '',
    description: '',
    status: 'Active',
    isPopular: false,
    rating: 5.0,
    pricingType: 'quantity' as 'quantity' | 'sqft'
  });

  // Queries
  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db, user]);
  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const subCategoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'subcategories'), orderBy('name', 'asc')) : null, [db]);
  
  const { data: services, isLoading } = useCollection(servicesQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: subcategories } = useCollection(subCategoriesQuery);

  const stats = useMemo(() => {
    if (!services) return { total: 0, active: 0, inactive: 0 };
    return {
      total: services.length,
      active: services.filter(s => s.status === 'Active').length,
      inactive: services.filter(s => s.status === 'Inactive').length
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(s => 
      s.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredServices?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServices?.map(s => s.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} services?`)) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'services', id)));
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Bulk Delete Completed" });
    } catch (e) {} finally {
      setIsBulkProcessing(false);
    }
  };

  const resetForm = useCallback(() => {
    setNewServiceData({
      title: '',
      basePrice: '',
      duration: '2-4 Hours',
      teamSize: '2 Persons',
      badgeText: '',
      description: '',
      status: 'Active',
      isPopular: false,
      rating: 5.0,
      pricingType: 'quantity'
    });
    setMainImageUrl('');
    setSelectedCatId('');
    setSelectedSubCatId('');
  }, []);

  const handleOpenAddModal = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSaveFull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const slug = newServiceData.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
      const serviceDoc = {
        ...newServiceData,
        slug: slug,
        categoryId: selectedCatId,
        subCategoryId: selectedSubCatId,
        basePrice: parseFloat(newServiceData.basePrice as string) || 0,
        imageUrl: mainImageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'services'), serviceDoc);
      toast({ title: "Service Created" });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSubs = useMemo(() => subcategories?.filter(s => s.categoryId === selectedCatId) || [], [subcategories, selectedCatId]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Service Catalog</h1>
          <p className="text-muted-foreground text-sm">Professional service definitions and pricing</p>
        </div>
        <Button className="w-full md:w-auto gap-2 font-black shadow-lg h-11 px-6 rounded-xl bg-primary hover:bg-primary/90" onClick={handleOpenAddModal}>
          <Plus size={18} /> {t('new_service')}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Active Services", val: stats.total, icon: Wrench, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Live Hub", val: stats.active, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Draft/Inactive", val: stats.inactive, icon: XCircle, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Total Bookings", val: "---", icon: Clock, bg: "bg-indigo-50", color: "text-indigo-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2rem] overflow-hidden">
        <div className="p-6 md:p-8 border-b bg-gray-50/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <Input 
              placeholder="Search by registry label..." 
              className="pl-12 h-12 bg-white border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedIds.length > 0 && (
            <Button variant="destructive" className="rounded-xl h-12 px-6 font-black uppercase text-xs" onClick={handleBulkDelete} disabled={isBulkProcessing}>
              Delete Selected ({selectedIds.length})
            </Button>
          )}
        </div>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-12 pl-6">
                    <Checkbox 
                      checked={filteredServices?.length ? selectedIds.length === filteredServices.length : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold py-5 pl-4 uppercase text-[10px] tracking-widest">Service Details</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Taxonomy</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Pricing</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
                ) : filteredServices?.map((service) => (
                  <TableRow key={service.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(service.id) && "bg-primary/5")}>
                    <TableCell className="pl-6">
                      <Checkbox 
                        checked={selectedIds.includes(service.id)}
                        onCheckedChange={() => toggleSelect(service.id)}
                      />
                    </TableCell>
                    <TableCell className="py-5 pl-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          {service.imageUrl && <Image src={service.imageUrl} alt={service.title} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] leading-tight">{service.title}</div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-tighter">ID: {service.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 text-primary border-none">{categories?.find(c => c.id === service.categoryId)?.name || 'General'}</Badge>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase pl-1">{subcategories?.find(s => s.id === service.subCategoryId)?.name || '---'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-primary text-sm">৳{service.basePrice?.toLocaleString()}</span>
                        <span className="text-[8px] font-black uppercase text-gray-400">{service.pricingType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("text-[8px] font-black uppercase border-none px-2 py-0.5", service.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500")}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" asChild><Link href={`/admin/services/${service.id}`}><Edit size={16} /></Link></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'services', service.id))}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 🛠️ IMPROVED SCROLLABLE DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col overflow-hidden bg-white">
          <form onSubmit={handleSaveFull} className="flex flex-col h-full overflow-hidden">
            <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Wrench className="text-primary" size={24} /> {t('new_service')}
                </DialogTitle>
                <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Configure identity and taxonomy hierarchy</DialogDescription>
              </div>
              <button type="button" onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b pb-2 flex items-center gap-2"><Layout size={14}/> Identity & Billing</h4>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Label</Label>
                      <Input 
                        value={newServiceData.title} 
                        onChange={e => setNewServiceData({...newServiceData, title: e.target.value})} 
                        required 
                        className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Base Rate (৳)</Label>
                        <Input 
                          type="number" 
                          value={newServiceData.basePrice} 
                          onChange={e => setNewServiceData({...newServiceData, basePrice: e.target.value})} 
                          required 
                          className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-black text-primary" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Pricing Logic</Label>
                        <Select value={newServiceData.pricingType} onValueChange={v => setNewServiceData({...newServiceData, pricingType: v as any})}>
                          <SelectTrigger className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="quantity">By Quantity (1, 2, 3...)</SelectItem>
                            <SelectItem value="sqft">By Area (Square Feet Slabs)</SelectItem>
                            <SelectItem value="fixed">Fixed Global Price</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest border-b pb-2 flex items-center gap-2"><FolderTree size={14}/> Taxonomy Mapping</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Level 1 (Main)</Label>
                        <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedSubCatId(''); }}>
                          <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Level 2 (Sub)</Label>
                        <Select value={selectedSubCatId} onValueChange={setSelectedSubCatId} disabled={!selectedCatId}>
                          <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {availableSubs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <ImageUploader 
                    label="Cover Asset" 
                    hint="800 x 600 px (4:3)"
                    initialUrl={mainImageUrl} 
                    onUpload={setMainImageUrl} 
                    aspectRatio="aspect-[4/3]"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Default Team Size</Label>
                      <Select value={newServiceData.teamSize} onValueChange={v => setNewServiceData({...newServiceData, teamSize: v})}>
                        <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {['1 Person', '2 Persons', '3-4 Persons', '5+ Expert Team'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Standard Duration</Label>
                      <Select value={newServiceData.duration} onValueChange={v => setNewServiceData({...newServiceData, duration: v})}>
                        <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {['1-2 Hours', '2-4 Hours', 'Full Day (8h)', 'Multi-Day Cycle'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 shadow-sm">
                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase">Most Popular</Label>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">SHOW BADGE ON HOMEPAGE</p>
                    </div>
                    <Switch checked={newServiceData.isPopular} onCheckedChange={val => setNewServiceData({...newServiceData, isPopular: val})} />
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description (Internal Memo & Customer Info)</Label>
                <Textarea 
                  value={newServiceData.description} 
                  onChange={e => setNewServiceData({...newServiceData, description: e.target.value})} 
                  className="bg-gray-50 border-none rounded-2xl min-h-[120px] p-6 leading-relaxed" 
                />
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border w-full sm:w-auto justify-between shadow-sm">
                <Label className="text-[10px] font-black uppercase text-gray-500">Live Active</Label>
                <Switch defaultChecked={true} onCheckedChange={v => setNewServiceData({...newServiceData, status: v ? 'Active' : 'Inactive'})} />
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none h-12 md:h-14 px-12 rounded-xl font-black bg-primary shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Publish Service</>}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
