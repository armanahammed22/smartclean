
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
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
  MapPin,
  Sparkles,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CAMPAIGN_TYPES = [
  { id: 'buy_x_get_y', label: 'Buy X Get Y Free', icon: Gift, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'bundle', label: 'Bundle / Package Deals', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'min_order', label: 'Min Order Discount', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'tiered', label: 'Tiered Loyalty Discount', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' }
];

export default function AdvancedOffersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  // Queries
  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'advanced_offers'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: offers, isLoading } = useCollection(offersQuery);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), where('status', '==', 'Active')) : null, [db]);
  const { data: products } = useCollection(productsQuery);

  const handleCreateOffer = async (typeId: string) => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'advanced_offers'), {
        title: 'New Advanced Campaign',
        type: typeId,
        isActive: false,
        targeting: 'All Customers',
        rules: {
          minSpend: 0,
          discountValue: 10,
          discountType: 'percentage',
          buyQty: 1,
          getQty: 1
        },
        createdAt: new Date().toISOString()
      });
      toast({ title: "Draft Campaign Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Creation Failed" });
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    if (!db) return;
    await updateDoc(doc(db, 'advanced_offers', id), data);
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this campaign?")) return;
    await deleteDoc(doc(db, 'advanced_offers', id));
    toast({ title: "Campaign Purged" });
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Marketing Engine</h1>
          <p className="text-muted-foreground text-sm font-medium">Deploy high-conversion automated offer logic</p>
        </div>
      </div>

      {/* 🚀 Campaign Type Selector */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CAMPAIGN_TYPES.map((type) => (
          <button 
            key={type.id}
            onClick={() => handleCreateOffer(type.id)}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border-2 border-transparent hover:border-primary hover:shadow-xl transition-all group active:scale-95"
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
        <TabsList className="bg-white border p-1 h-12 rounded-xl">
          <TabsTrigger value="active" className="rounded-lg flex-1 font-black text-[10px] uppercase">Active Protocols ({offers?.filter(o => o.isActive).length || 0})</TabsTrigger>
          <TabsTrigger value="drafts" className="rounded-lg flex-1 font-black text-[10px] uppercase">Drafts ({offers?.filter(o => !o.isActive).length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : 
              offers?.filter(o => activeTab === 'active' ? o.isActive : !o.isActive).map((offer) => (
                <Card key={offer.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group border border-gray-100">
                  <div className="bg-gray-50/50 p-6 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#081621] text-primary rounded-2xl shadow-lg shadow-primary/10">
                        {CAMPAIGN_TYPES.find(t => t.id === offer.type)?.icon ? React.createElement(CAMPAIGN_TYPES.find(t => t.id === offer.type)!.icon, { size: 20 }) : <Zap size={20}/>}
                      </div>
                      <div>
                        <Input 
                          defaultValue={offer.title} 
                          onBlur={e => handleUpdate(offer.id, { title: e.target.value })}
                          className="h-8 border-none bg-transparent font-black uppercase text-sm p-0 w-[200px]"
                        />
                        <Badge variant="secondary" className="text-[8px] font-black uppercase bg-white border-primary/10 text-primary mt-1">
                          {offer.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={offer.isActive} onCheckedChange={v => handleUpdate(offer.id, { isActive: v })} />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)} className="h-9 w-9 text-destructive"><Trash2 size={18}/></Button>
                    </div>
                  </div>

                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2">
                          <Settings2 size={12}/> Rule Logic
                        </h4>
                        
                        {offer.type === 'buy_x_get_y' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black text-gray-400">BUY QTY (X)</Label>
                              <Input type="number" defaultValue={offer.rules?.buyQty} onBlur={e => handleUpdate(offer.id, { 'rules.buyQty': parseInt(e.target.value) })} className="h-10 bg-gray-50 border-none font-black" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black text-gray-400">GET QTY (Y)</Label>
                              <Input type="number" defaultValue={offer.rules?.getQty} onBlur={e => handleUpdate(offer.id, { 'rules.getQty': parseInt(e.target.value) })} className="h-10 bg-gray-50 border-none font-black text-primary" />
                            </div>
                          </div>
                        )}

                        {offer.type === 'min_order' && (
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black text-gray-400">MIN SPEND (৳)</Label>
                            <Input type="number" defaultValue={offer.rules?.minSpend} onBlur={e => handleUpdate(offer.id, { 'rules.minSpend': parseFloat(e.target.value) })} className="h-10 bg-gray-50 border-none font-black text-primary" />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black text-gray-400">DISCOUNT TYPE</Label>
                            <Select defaultValue={offer.rules?.discountType} onValueChange={v => handleUpdate(offer.id, { 'rules.discountType': v })}>
                              <SelectTrigger className="h-10 bg-gray-50 border-none font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="percentage">% Percent</SelectItem>
                                <SelectItem value="fixed">৳ Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black text-gray-400">VALUE</Label>
                            <Input type="number" defaultValue={offer.rules?.discountValue} onBlur={e => handleUpdate(offer.id, { 'rules.discountValue': parseFloat(e.target.value) })} className="h-10 bg-gray-50 border-none font-black text-primary" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border-b pb-2 flex items-center gap-2">
                          <Target size={12}/> Targeting
                        </h4>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black text-gray-400">AUDIENCE SEGMENT</Label>
                          <Select defaultValue={offer.targeting} onValueChange={v => handleUpdate(offer.id, { targeting: v })}>
                            <SelectTrigger className="h-10 bg-gray-50 border-none font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="All Customers">All Marketplace</SelectItem>
                              <SelectItem value="New Customers">New Users Only</SelectItem>
                              <SelectItem value="Loyalty Members">Loyalty Members</SelectItem>
                              <SelectItem value="Dhaka Only">Location: Dhaka</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <p className="text-[9px] text-blue-800 font-bold uppercase leading-relaxed">
                            <Info size={10} className="inline mr-1" /> Auto-applies at checkout for eligible segments.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
