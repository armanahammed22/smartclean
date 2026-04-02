'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, where, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Gift, 
  Target, 
  Users, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Settings2, 
  Clock, 
  Timer,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AdvancedOffer } from '@/types';
import Image from 'next/image';

const CAMPAIGN_TYPES = [
  { id: 'buy_x_get_y', label: 'Buy X Get Y Free', icon: Gift, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'bundle', label: 'Bundle / Package Deals', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'min_order', label: 'Min Order Discount', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'tiered', label: 'Tiered Loyalty Discount', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' }
];

export default function AdvancedOffersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<AdvancedOffer> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'advanced_offers'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: offers, isLoading } = useCollection(offersQuery);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), where('status', '==', 'Active')) : null, [db]);
  const { data: products } = useCollection(productsQuery);

  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);
  const { data: services } = useCollection(servicesQuery);

  const allItems = useMemo(() => {
    return [
      ...(products?.map(p => ({ ...p, itemType: 'product' })) || []),
      ...(services?.map(s => ({ ...s, itemType: 'service', name: s.title })) || [])
    ];
  }, [products, services]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return allItems.slice(0, 10);
    return allItems.filter(item => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [allItems, searchTerm]);

  const handleCreateNew = (typeId: string) => {
    setEditingOffer({
      title: '',
      type: typeId as any,
      status: 'Draft',
      targeting: 'All Customers',
      applicableItems: [],
      rules: {
        discountValue: 0,
        discountType: 'percentage',
        minSpend: 0,
        buyQty: 1,
        getQty: 1
      },
      startDate: new Date().toISOString().slice(0, 16),
      endDate: ''
    });
    setIsModalOpen(true);
  };

  const validate = (data: Partial<AdvancedOffer>) => {
    if (!data.title?.trim()) return "Campaign Name is required.";
    if (!data.applicableItems?.length) return "Select at least one Product or Service.";
    if (!data.rules?.discountValue || data.rules.discountValue <= 0) return "Discount value must be greater than 0.";
    if (!data.startDate) return "Start Date is required.";
    if (!data.endDate) return "End Date is required.";
    if (new Date(data.startDate) >= new Date(data.endDate)) return "End Date must be after Start Date.";
    return null;
  };

  const getStatus = (data: Partial<AdvancedOffer>) => {
    const now = new Date();
    const start = new Date(data.startDate!);
    const end = new Date(data.endDate!);
    if (end < now) return 'Expired';
    if (start > now) return 'Scheduled';
    return 'Live';
  };

  const handleSaveDraft = async () => {
    if (!db || !editingOffer) return;
    setIsSubmitting(true);
    try {
      const data = { ...editingOffer, status: 'Draft', updatedAt: new Date().toISOString() };
      if (editingOffer.id) {
        await setDoc(doc(db, 'advanced_offers', editingOffer.id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'advanced_offers'), { ...data, createdAt: new Date().toISOString() });
      }
      toast({ title: "Draft Saved", description: "Campaign saved but not live." });
      setIsModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (offerToPublish?: Partial<AdvancedOffer>) => {
    const data = offerToPublish || editingOffer;
    if (!db || !data) return;

    const error = validate(data);
    if (error) {
      toast({ variant: "destructive", title: "Publish Error", description: error });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData = { 
        ...data, 
        status: getStatus(data), 
        updatedAt: new Date().toISOString() 
      };
      if (data.id) {
        await setDoc(doc(db, 'advanced_offers', data.id), finalData, { merge: true });
      } else {
        await addDoc(collection(db, 'advanced_offers'), { ...finalData, createdAt: new Date().toISOString() });
      }
      toast({ title: "Campaign Published", description: `Campaign is now ${finalData.status}.` });
      setIsModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Publish Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this campaign permanently?")) return;
    await deleteDoc(doc(db, 'advanced_offers', id));
    toast({ title: "Campaign Purged" });
  };

  const toggleItem = (id: string) => {
    if (!editingOffer) return;
    const current = editingOffer.applicableItems || [];
    const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
    setEditingOffer({ ...editingOffer, applicableItems: next });
  };

  const activeAndScheduled = offers?.filter(o => o.status === 'Live' || o.status === 'Scheduled') || [];
  const drafts = offers?.filter(o => o.status === 'Draft') || [];
  const expired = offers?.filter(o => o.status === 'Expired') || [];

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Campaign Protocols</h1>
          <p className="text-muted-foreground text-sm font-medium">Deploy high-conversion automated offer logic</p>
        </div>
      </div>

      {/* 🚀 Protocol Selector */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CAMPAIGN_TYPES.map((type) => (
          <button 
            key={type.id}
            onClick={() => handleCreateNew(type.id)}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border-2 border-transparent hover:border-primary hover:shadow-xl transition-all group active:scale-95 shadow-sm"
          >
            <div className={cn("p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform", type.bg, type.color)}>
              <type.icon size={28} />
            </div>
            <span className="text-[10px] font-black uppercase text-gray-900 tracking-tighter leading-tight text-center">{type.label}</span>
            <Plus size={14} className="mt-2 text-gray-300" />
          </button>
        ))}
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-2xl overflow-x-auto no-scrollbar">
          <TabsTrigger value="active" className="rounded-lg flex-1 font-black text-[10px] uppercase gap-2">
            <CheckCircle2 size={14}/> Active/Scheduled ({activeAndScheduled.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="rounded-lg flex-1 font-black text-[10px] uppercase gap-2">
            <Layers size={14}/> Drafts ({drafts.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="rounded-lg flex-1 font-black text-[10px] uppercase gap-2">
            <Clock size={14}/> History ({expired.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : 
              (activeTab === 'active' ? activeAndScheduled : activeTab === 'drafts' ? drafts : expired).map((offer) => (
                <Card key={offer.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group border border-gray-100 relative">
                  <div className="bg-gray-50/50 p-6 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#081621] text-primary rounded-2xl shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform">
                        {CAMPAIGN_TYPES.find(t => t.id === offer.type)?.icon ? React.createElement(CAMPAIGN_TYPES.find(t => t.id === offer.type)!.icon, { size: 20 }) : <Zap size={20}/>}
                      </div>
                      <div>
                        <h3 className="font-black uppercase text-sm text-gray-900">{offer.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[7px] font-black uppercase bg-white border-primary/10 text-primary">{offer.type.replace(/_/g, ' ')}</Badge>
                          <Badge className={cn(
                            "text-[7px] font-black uppercase border-none h-4 px-1.5",
                            offer.status === 'Live' ? "bg-green-100 text-green-700" :
                            offer.status === 'Scheduled' ? "bg-blue-100 text-blue-700" :
                            offer.status === 'Expired' ? "bg-gray-100 text-gray-500" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {offer.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingOffer(offer); setIsModalOpen(true); }}><Edit size={16}/></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(offer.id)}><Trash2 size={16}/></Button>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <span>{offer.applicableItems?.length || 0} Items linked</span>
                      <span>Target: {offer.targeting}</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Discount Protocol</span>
                        <span className="text-sm font-black text-primary">
                          {offer.rules.discountType === 'percentage' ? `${offer.rules.discountValue}% Off` : `৳${offer.rules.discountValue} Flat`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase">
                        <Calendar size={10}/> {new Date(offer.startDate).toLocaleDateString()} → {new Date(offer.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    {offer.status === 'Draft' && (
                      <Button onClick={() => handlePublish(offer)} className="w-full h-10 rounded-xl font-black uppercase text-[10px] bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20">
                        <Zap size={14} className="mr-2" /> Activate Protocol
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            }
            {((activeTab === 'active' && activeAndScheduled.length === 0) || 
               (activeTab === 'drafts' && drafts.length === 0) ||
               (activeTab === 'expired' && expired.length === 0)) && !isLoading && (
              <div className="col-span-full p-20 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
                <Sparkles size={40} className="text-gray-200" />
                No campaigns found in this segment.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 🛠️ CAMPAIGN CONFIG MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] rounded-t-[2.5rem] md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-2xl shadow-xl"><Gift size={24}/></div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Campaign Configuration</DialogTitle>
                <DialogDescription className="text-white/40 font-bold uppercase text-[9px]">Module: {editingOffer?.type?.replace(/_/g, ' ')}</DialogDescription>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Rules & Info */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Campaign Title</Label>
                    <Input 
                      value={editingOffer?.title} 
                      onChange={e => setEditingOffer({...editingOffer, title: e.target.value})}
                      placeholder="e.g. Eid Mega Sale 2026"
                      className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2">
                        <Settings2 size={12}/> Rule Logic
                      </h4>
                      {editingOffer?.type === 'buy_x_get_y' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black">Buy Qty</Label>
                            <Input type="number" value={editingOffer?.rules?.buyQty} onChange={e => setEditingOffer({...editingOffer, rules: {...editingOffer.rules!, buyQty: parseInt(e.target.value)}})} className="h-10 bg-gray-50 border-none font-black" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black">Free Qty</Label>
                            <Input type="number" value={editingOffer?.rules?.getQty} onChange={e => setEditingOffer({...editingOffer, rules: {...editingOffer.rules!, getQty: parseInt(e.target.value)}})} className="h-10 bg-gray-50 border-none font-black text-primary" />
                          </div>
                        </div>
                      )}
                      {editingOffer?.type === 'min_order' && (
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black">Min Spend (৳)</Label>
                          <Input type="number" value={editingOffer?.rules?.minSpend} onChange={e => setEditingOffer({...editingOffer, rules: {...editingOffer.rules!, minSpend: parseFloat(e.target.value)}})} className="h-10 bg-gray-50 border-none font-black text-primary" />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black">Discount Type</Label>
                          <Select value={editingOffer?.rules?.discountType} onValueChange={v => setEditingOffer({...editingOffer, rules: {...editingOffer.rules!, discountType: v as any}})}>
                            <SelectTrigger className="h-10 bg-gray-50 border-none font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="percentage">% Percent</SelectItem>
                              <SelectItem value="fixed">৳ Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black">Value</Label>
                          <Input type="number" value={editingOffer?.rules?.discountValue} onChange={e => setEditingOffer({...editingOffer, rules: {...editingOffer.rules!, discountValue: parseFloat(e.target.value)}})} className="h-10 bg-gray-50 border-none font-black text-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border-b pb-2 flex items-center gap-2">
                        <Timer size={12}/> Timing
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black">Start Date</Label>
                          <Input type="datetime-local" value={editingOffer?.startDate?.slice(0, 16)} onChange={e => setEditingOffer({...editingOffer, startDate: new Date(e.target.value).toISOString()})} className="h-10 bg-gray-50 border-none text-[10px] font-black" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black">End Date</Label>
                          <Input type="datetime-local" value={editingOffer?.endDate?.slice(0, 16)} onChange={e => setEditingOffer({...editingOffer, endDate: new Date(e.target.value).toISOString()})} className="h-10 bg-gray-50 border-none text-[10px] font-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Picker */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col h-[400px]">
                  <Label className="text-[10px] font-black uppercase mb-4 flex items-center justify-between">
                    Link Items <Badge className="bg-primary text-white border-none">{editingOffer?.applicableItems?.length || 0} SELECTED</Badge>
                  </Label>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <Input 
                      placeholder="Search items..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="h-10 pl-9 bg-white border-none rounded-xl text-xs"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {filteredItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          "p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 group",
                          editingOffer?.applicableItems?.includes(item.id) ? "border-primary bg-primary/5" : "border-transparent bg-white hover:border-primary/20"
                        )}
                      >
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0 border">
                          {item.imageUrl && <Image src={item.imageUrl} alt="P" fill className="object-cover" unoptimized />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase truncate text-gray-900 leading-none">{item.name}</p>
                          <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">{item.itemType} • ৳{item.price}</p>
                        </div>
                        {editingOffer?.applicableItems?.includes(item.id) && <CheckCircle2 size={16} className="text-primary" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t flex flex-col sm:flex-row gap-3 shrink-0">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold uppercase text-[10px]">Cancel</Button>
            <div className="flex-1 flex gap-3">
              <Button onClick={handleSaveDraft} disabled={isSubmitting} variant="outline" className="flex-1 rounded-xl font-black uppercase text-[10px] border-primary/20 text-primary bg-white shadow-sm">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Layers size={16} className="mr-2" />} Save as Draft
              </Button>
              <Button onClick={() => handlePublish()} disabled={isSubmitting} className="flex-1 rounded-xl font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Zap size={16} className="mr-2" />} Publish / Go Live
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Edit(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
