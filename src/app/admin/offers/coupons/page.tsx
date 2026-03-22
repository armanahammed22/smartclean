'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  TicketPercent, 
  Loader2,
  Calendar,
  Save
} from 'lucide-react';

export default function CouponsManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const couponsQuery = useMemoFirebase(() => db ? query(collection(db, 'coupons'), orderBy('code', 'asc')) : null, [db]);
  const { data: coupons, isLoading } = useCollection(couponsQuery);

  const handleToggleStatus = async (id: string, current: string) => {
    if (!db) return;
    const newStatus = current === 'Active' ? 'Inactive' : 'Active';
    await updateDoc(doc(db, 'coupons', id), { status: newStatus });
    toast({ title: "Status Updated" });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this coupon code permanently?")) return;
    await deleteDoc(doc(db, 'coupons', id));
    toast({ title: "Coupon Deleted" });
  };

  const handleAddCoupon = async () => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'coupons'), {
        code: 'NEW' + Math.floor(Math.random() * 999),
        discountType: 'percent',
        value: 10,
        status: 'Active',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      toast({ title: "New Coupon Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Creation Failed" });
    }
  };

  const handleUpdateCouponField = async (id: string, data: any) => {
    if (!db) return;
    await updateDoc(doc(db, 'coupons', id), data);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Coupon Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Create and track discount codes for checkout</p>
        </div>
        <Button onClick={handleAddCoupon} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> Create New Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin inline text-primary" size={32} /></div>
        ) : coupons?.map((coupon) => (
          <Card key={coupon.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group border border-gray-100">
            <div className="h-1.5 bg-primary w-full" />
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black font-mono text-primary tracking-tighter uppercase">{coupon.code}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                    <Calendar size={12} className="text-gray-400" /> 
                    Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch 
                    checked={coupon.status === 'Active'} 
                    onCheckedChange={() => handleToggleStatus(coupon.id, coupon.status)} 
                  />
                  <Badge className={coupon.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {coupon.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                <div className="space-y-1.5">
                  <Label className="text-[8px] uppercase font-black text-muted-foreground tracking-widest">Type</Label>
                  <Select defaultValue={coupon.discountType} onValueChange={(val) => handleUpdateCouponField(coupon.id, { discountType: val })}>
                    <SelectTrigger className="h-9 text-xs bg-gray-50 border-none font-bold rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage %</SelectItem>
                      <SelectItem value="flat">Flat Amount ৳</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[8px] uppercase font-black text-muted-foreground tracking-widest">Value</Label>
                  <Input 
                    type="number" 
                    className="h-9 text-xs bg-gray-50 border-none font-black rounded-lg" 
                    defaultValue={coupon.value} 
                    onBlur={(e) => handleUpdateCouponField(coupon.id, { value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-[10px] text-gray-400 font-medium">Real-time update on blur</p>
                <Button variant="ghost" size="sm" className="text-destructive h-8 px-3 gap-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-full" onClick={() => handleDelete(coupon.id)}>
                  <Trash2 size={12} /> Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!coupons?.length && !isLoading && (
          <div className="col-span-full p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
            <TicketPercent size={48} className="opacity-20" />
            <p className="font-bold">No coupons found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
