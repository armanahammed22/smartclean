
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  User, 
  ShoppingCart, 
  Calendar, 
  Wallet, 
  ShieldCheck, 
  Package, 
  Wrench, 
  ArrowLeft, 
  Loader2, 
  Save, 
  AlertTriangle,
  FileText,
  Clock,
  MapPin,
  TrendingUp,
  Phone,
  Mail,
  Building2,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function VendorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const vendorRef = useMemoFirebase(() => (db && id) ? doc(db, 'vendor_profiles', id as string) : null, [db, id]);
  const { data: vendor, isLoading: vLoading } = useDoc(vendorRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const productsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'products'), where('vendorId', '==', id)) : null, [db, id]);
  const servicesQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services'), where('vendorId', '==', id)) : null, [db, id]);
  const ordersQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'orders'), where('vendorId', '==', id), orderBy('createdAt', 'desc')) : null, [db, id]);
  const bookingsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'bookings'), where('vendorId', '==', id), orderBy('createdAt', 'desc')) : null, [db, id]);
  const ledgerQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'finance_ledger'), where('partnerVendorId', '==', id), orderBy('date', 'desc')) : null, [db, id]);

  const { data: vendorProducts, isLoading: pLoading } = useCollection(productsQuery);
  const { data: vendorServices, isLoading: sLoading } = useCollection(servicesQuery);
  const { data: vendorOrders } = useCollection(ordersQuery);
  const { data: vendorBookings } = useCollection(bookingsQuery);
  const { data: ledgerEntries } = useCollection(ledgerQuery);

  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  const [activeTab, setActiveTab] = useState('overview');

  const stats = useMemo(() => {
    return {
      revenue: vendorOrders?.reduce((a, c) => a + (c.totalPrice || 0), 0) || 0,
      bookings: vendorBookings?.length || 0,
      orders: vendorOrders?.length || 0,
      unpaidCommission: ledgerEntries?.filter(l => l.paidStatus === 'Unpaid').reduce((a, c) => a + (c.amount || 0), 0) || 0,
    };
  }, [vendorOrders, vendorBookings, ledgerEntries]);

  const handleUpdateVendor = async (data: any) => {
    if (!vendorRef) return;
    setIsSaving(true);
    try {
      await updateDoc(vendorRef, { ...data, updatedAt: new Date().toISOString() });
      toast({ title: "Vendor Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (vLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" size={40} /></div>;
  if (!vendor) return <div className="p-20 text-center uppercase font-black opacity-20">Vendor Not Found</div>;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{vendor.shopName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn(
                "text-[8px] font-black border-none uppercase px-2",
                vendor.status === 'Approved' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              )}>
                {vendor.status}
              </Badge>
              <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">ID: {vendor.id.slice(0, 12)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold" asChild>
            <Link href={`/vendors/${vendor.id}`} target="_blank"><ExternalLink size={16} className="mr-2" /> View Public Store</Link>
          </Button>
          <Button onClick={() => handleUpdateVendor({})} disabled={isSaving} className="h-11 px-8 rounded-xl font-black uppercase tracking-tight shadow-xl shadow-primary/20 gap-2">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", val: `৳${stats.revenue.toLocaleString()}`, icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Commission Due", val: `৳${stats.unpaidCommission.toLocaleString()}`, icon: Wallet, bg: "bg-rose-50", color: "text-rose-600" },
          { label: "Active Orders", val: stats.orders, icon: ShoppingCart, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Service Bookings", val: stats.bookings, icon: Calendar, bg: "bg-indigo-50", color: "text-indigo-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 w-full max-w-4xl rounded-xl overflow-x-auto no-scrollbar">
          <TabsTrigger value="overview" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Layout size={14} /> Overview</TabsTrigger>
          {productsEnabled && <TabsTrigger value="products" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Package size={14} /> Products</TabsTrigger>}
          {servicesEnabled && <TabsTrigger value="services" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Wrench size={14} /> Services</TabsTrigger>}
          <TabsTrigger value="orders" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><ShoppingCart size={14} /> Sales History</TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Wallet size={14} /> Commission</TabsTrigger>
          <TabsTrigger value="verification" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><ShieldCheck size={14} /> KYC</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 p-8 border-b">
                <CardTitle className="text-lg font-bold">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={16}/></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Owner Name</p><p className="font-bold">{vendor.ownerName}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Phone size={16}/></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Contact Phone</p><p className="font-bold">{vendor.phone}</p></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Mail size={16}/></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Email Address</p><p className="font-bold">{vendor.email}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><MapPin size={16}/></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Business Address</p><p className="text-xs font-bold">{vendor.businessAddress}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} /></div>
              <div className="relative z-10 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tight text-primary">Operational Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <Label className="text-xs font-black uppercase">Accept Orders</Label>
                    <Switch checked={vendor.status === 'Approved'} onCheckedChange={(v) => handleUpdateVendor({ status: v ? 'Approved' : 'Suspended' })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-white/40 ml-1">Override Commission (%)</Label>
                    <Input 
                      type="number" 
                      defaultValue={vendor.commissionRate || 10} 
                      onBlur={(e) => handleUpdateVendor({ commissionRate: parseFloat(e.target.value) || 10 })}
                      className="h-11 bg-white/10 border-none font-black text-primary"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8 border border-gray-100">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                <ShieldCheck size={16} /> Verification Summary
              </CardTitle>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">Trade License</span>
                  <Badge variant="outline" className={cn("text-[8px]", vendor.isVerified ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>{vendor.isVerified ? 'VERIFIED' : 'PENDING'}</Badge>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">Identity Doc</span>
                  <Badge variant="outline" className={cn("text-[8px]", vendor.isIdVerified ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>{vendor.isIdVerified ? 'VERIFIED' : 'PENDING'}</Badge>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">Bank Details</span>
                  <Badge variant="outline" className="text-[8px] bg-green-50 text-green-700">SUBMITTED</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6 rounded-xl font-black uppercase text-[10px] tracking-widest h-10" onClick={() => setActiveTab('verification')}>Review Documents</Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Manage Inventory</CardTitle>
                <CardDescription>Product listings owned by this vendor</CardDescription>
              </div>
              <Badge className="bg-primary text-white border-none font-black">{vendorProducts?.length || 0} ITEMS</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow>
                    <TableHead className="pl-8">Product Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right pr-8">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pLoading ? <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin inline" /></TableCell></TableRow> : vendorProducts?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border">
                            {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm uppercase truncate">{p.name}</p>
                            <p className="text-[9px] font-mono text-muted-foreground">ID: {p.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[8px]">{p.categoryId}</Badge></TableCell>
                      <TableCell><span className={cn("font-black text-xs", p.stockQuantity < 10 ? "text-red-600" : "text-gray-900")}>{p.stockQuantity}</span></TableCell>
                      <TableCell className="font-black">৳{p.price}</TableCell>
                      <TableCell className="text-right pr-8">
                        <Badge variant="secondary" className={cn("text-[8px] font-black uppercase", p.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500")}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Manage Services</CardTitle>
                <CardDescription>Professional services offered by this provider</CardDescription>
              </div>
              <Badge className="bg-primary text-white border-none font-black">{vendorServices?.length || 0} SERVICES</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow>
                    <TableHead className="pl-8">Service Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Base Rate</TableHead>
                    <TableHead className="text-right pr-8">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sLoading ? <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin inline" /></TableCell></TableRow> : vendorServices?.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border">
                            {s.imageUrl && <Image src={s.imageUrl} alt={s.title} fill className="object-cover" unoptimized />}
                          </div>
                          <p className="font-bold text-sm uppercase">{s.title}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[8px]">{s.categoryId}</Badge></TableCell>
                      <TableCell className="text-xs text-gray-500 font-bold">{s.duration}</TableCell>
                      <TableCell className="font-black text-primary">৳{s.basePrice}</TableCell>
                      <TableCell className="text-right pr-8">
                        <Badge variant="secondary" className={cn("text-[8px] font-black uppercase", s.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500")}>{s.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
              <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow>
                    <TableHead className="pl-8">ID / Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right pr-8">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(vendorOrders || []), ...(vendorBookings || [])].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(order => (
                    <TableRow key={order.id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-8 py-4">
                        <p className="font-black text-xs uppercase">#{order.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{order.customerName}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold text-gray-500">{order.items?.length || 1} Item(s)</span>
                      </TableCell>
                      <TableCell className="font-black">৳{order.totalPrice?.toLocaleString()}</TableCell>
                      <TableCell className="text-[10px] font-bold text-gray-400">{format(new Date(order.createdAt), 'MMM dd, HH:mm')}</TableCell>
                      <TableCell className="text-right pr-8">
                        <Badge variant="secondary" className="text-[8px] font-black uppercase px-2">{order.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
              <CardTitle className="text-lg font-bold">Commission & Settlements</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow>
                    <TableHead className="pl-8">Date</TableHead>
                    <TableHead>Source ID</TableHead>
                    <TableHead>Order Value</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead className="text-right pr-8">Settlement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries?.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="pl-8 py-4 text-[10px] font-bold text-gray-400">{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-mono text-[10px] font-black">#{entry.sourceId?.slice(0, 12)}</TableCell>
                      <TableCell className="text-xs font-bold">৳{entry.notes?.match(/৳(\d+)/)?.[1] || '---'}</TableCell>
                      <TableCell className="font-black text-rose-600">৳{entry.amount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-8">
                        <Badge className={cn("text-[8px] font-black uppercase", entry.paidStatus === 'Paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>{entry.paidStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">KYC & Documents</CardTitle>
                <CardDescription>Review uploaded credentials for platform trust</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 font-black h-9 rounded-xl text-[9px] uppercase" onClick={() => handleUpdateVendor({ isVerified: false, isIdVerified: false, status: 'Rejected' })}>Reject All</Button>
                <Button className="bg-green-600 hover:bg-green-700 font-black h-9 rounded-xl text-[9px] uppercase" onClick={() => handleUpdateVendor({ isVerified: true, isIdVerified: true, status: 'Approved' })}>Approve All</Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><FileText size={14}/> Trade License</Label>
                      <Switch checked={vendor.isVerified} onCheckedChange={(v) => handleUpdateVendor({ isVerified: v })} />
                    </div>
                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center group">
                      {vendor.tradeLicenseUrl ? <Image src={vendor.tradeLicenseUrl} alt="Doc" fill className="object-contain p-2" unoptimized /> : <AlertTriangle className="text-gray-300" size={48} />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" className="font-black text-[9px]">VIEW FULL</Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><User size={14}/> Identity Card (NID)</Label>
                      <Switch checked={vendor.isIdVerified} onCheckedChange={(v) => handleUpdateVendor({ isIdVerified: v })} />
                    </div>
                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center group">
                      {vendor.nidUrl ? <Image src={vendor.nidUrl} alt="Doc" fill className="object-contain p-2" unoptimized /> : <AlertTriangle className="text-gray-300" size={48} />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" className="font-black text-[9px]">VIEW FULL</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Building2 size={16}/> Bank Account for Settlements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Account Name</p>
                    <p className="text-sm font-bold text-gray-900">{vendor.bankInfo?.name || '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Account Number</p>
                    <p className="text-sm font-mono font-bold text-gray-900">{vendor.bankInfo?.accountNo || '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Bank Branch</p>
                    <p className="text-sm font-bold text-gray-900">{vendor.bankInfo?.branch || '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Routing No</p>
                    <p className="text-sm font-mono font-bold text-gray-900">{vendor.bankInfo?.routing || '---'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
