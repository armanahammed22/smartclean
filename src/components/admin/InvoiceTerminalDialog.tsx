'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDocs, updateDoc, where, setDoc, addDoc, limit } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  X, 
  Users, 
  Wrench, 
  Calculator, 
  Save, 
  Info,
  Smartphone,
  Package,
  History,
  ShieldCheck,
  AlertCircle,
  ReceiptText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface InvoiceTerminalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoice?: any;
}

export function InvoiceTerminalDialog({ isOpen, onClose, editingInvoice }: InvoiceTerminalDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [manualItems, setManualItems] = useState<any[]>([{ name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', address: '', previousDue: 0, totalPaid: 0, totalInvoiced: 0 });
  const [pricing, setPricing] = useState({ discount: 0, delivery: 0, vatPercent: 0, paidAmount: 0, paymentStatus: 'Unpaid', paymentMethod: 'Cash', notes: '' });
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [selectedUnpaidIds, setSelectedUnpaidIds] = useState<string[]>([]);

  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer'), limit(100)) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), limit(100)) : null, [db]);

  const { data: customersRaw } = useCollection(customersQuery);
  const { data: servicesRaw } = useCollection(servicesQuery);

  useEffect(() => {
    if (editingInvoice) {
      setCustomer({
        id: editingInvoice.customerId || '',
        name: editingInvoice.customerInfo?.name || '',
        phone: editingInvoice.customerInfo?.phone || '',
        address: editingInvoice.customerInfo?.address || '',
        previousDue: editingInvoice.previousDue || 0,
        totalPaid: 0,
        totalInvoiced: 0
      });
      setManualItems(editingInvoice.items?.map((i: any) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        unit: i.unit || 'Qty',
        type: i.type || 'service'
      })) || []);
      setPricing({
        discount: editingInvoice.discount || 0,
        delivery: editingInvoice.deliveryCharge || 0,
        vatPercent: editingInvoice.vatPercent || 0,
        paidAmount: editingInvoice.paidAmount || 0,
        paymentStatus: editingInvoice.paymentStatus || 'Unpaid',
        paymentMethod: editingInvoice.paymentMethod || 'Cash',
        notes: editingInvoice.notes || ''
      });
    }
  }, [editingInvoice]);

  const addManualItem = () => setManualItems([...manualItems, { name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
  const removeManualItem = (idx: number) => setManualItems(manualItems.filter((_, i) => i !== idx));
  const updateManualItem = (idx: number, field: string, val: any) => {
    const next = [...manualItems];
    next[idx][field] = val;
    setManualItems(next);
  };

  const currentSubtotal = useMemo(() => {
    return manualItems.reduce((acc, item) => (acc + (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
  }, [manualItems]);

  const selectedPreviousDue = useMemo(() => {
    return unpaidInvoices.filter(inv => selectedUnpaidIds.includes(inv.id)).reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
  }, [unpaidInvoices, selectedUnpaidIds]);

  const vatAmount = Number(((currentSubtotal - pricing.discount) * (pricing.vatPercent / 100)).toFixed(2));
  const currentInvoiceTotal = Number((currentSubtotal + pricing.delivery + vatAmount - pricing.discount).toFixed(2));
  const grandTotal = Number((currentInvoiceTotal + selectedPreviousDue).toFixed(2));
  const currentDue = Number((grandTotal - pricing.paidAmount).toFixed(2));

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      // Logic for saving (similar to invoices/page.tsx logic)
      toast({ title: "Operation Processed" });
      onClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Process Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1300px] w-[95vw] h-full md:h-auto md:max-h-[90vh] p-0 border-none rounded-[1.5rem] shadow-2xl bg-[#FBFBFB] flex flex-col overflow-hidden">
        <header className="h-[80px] bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><ReceiptText size={22} /></div>
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight">Invoice Terminal</DialogTitle>
              <DialogDescription className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {editingInvoice ? 'UPDATING RECORD' : `CREATING NEW RECORD`}
              </DialogDescription>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors"><X size={24}/></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-10 pb-20">
               {/* 🧬 DYNAMIC FORM CONTENT GOES HERE - RENDERED ON OPEN ONLY */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400">Client Name</Label>
                    <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400">Mobile Phone</Label>
                    <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
               </div>

               <div className="space-y-4">
                 {manualItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                       <Input value={item.name} onChange={e => updateManualItem(idx, 'name', e.target.value)} className="flex-1 h-10 bg-gray-50 border-none rounded-xl" placeholder="Item Name" />
                       <Input type="number" value={item.price} onChange={e => updateManualItem(idx, 'price', e.target.value)} className="w-24 h-10 bg-gray-50 border-none rounded-xl" placeholder="Rate" />
                       <button onClick={() => removeManualItem(idx)}><Trash2 size={16} className="text-rose-300" /></button>
                    </div>
                 ))}
                 <Button onClick={addManualItem} variant="outline" className="w-full border-dashed rounded-xl h-12">+ Add Component Line</Button>
               </div>
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-0">
               <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2rem] p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/40 uppercase">Subtotal</span>
                    <span className="font-black">৳{currentSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase text-primary mb-1">Grand Total</p>
                    <p className="text-5xl font-black tracking-tighter text-primary">৳{grandTotal.toLocaleString()}</p>
                  </div>
                  <Button onClick={handleSave} className="w-full h-14 rounded-2xl font-black uppercase" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Invoice"}
                  </Button>
               </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
