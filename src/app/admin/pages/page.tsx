
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, getDocs, where, addDoc } from 'firebase/firestore';
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
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DEFAULT_PAGES = [
  { slug: 'about-us', title: 'About Us', content: '<h2>About Smart Clean</h2><p>Smart Clean is the leading provider of professional cleaning and maintenance services in Bangladesh. Our mission is to provide intelligent, efficient, and reliable solutions for homes and businesses.</p><h3>Our Values</h3><ul><li>Integrity and Trust</li><li>Professional Excellence</li><li>Customer Satisfaction</li></ul>' },
  { slug: 'careers', title: 'Careers', content: '<h2>Join Our Team</h2><p>We are always looking for dedicated and professional individuals to join our growing family. At Smart Clean, we value hard work and provide extensive training.</p><p>Interested candidates can send their CV to jobs@smartclean.local</p>' },
  { slug: 'privacy-policy', title: 'Privacy Policy', content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. This policy describes how we collect, use, and protect your personal information when you use our website and services.</p><h3>Data Collection</h3><p>We collect information such as your name, phone number, and address to facilitate bookings and deliveries.</p>' },
  { slug: 'terms-of-service', title: 'Terms of Service', content: '<h2>Terms of Service</h2><p>By accessing or using Smart Clean services, you agree to be bound by these terms. Please read them carefully.</p><h3>Service Booking</h3><p>All bookings are subject to staff availability and area coverage.</p>' },
  { slug: 'refund-policy', title: 'Refund Policy', content: '<h2>Refund & Cancellation Policy</h2><p>We strive for 100% customer satisfaction. If you are not satisfied with our service, please contact us within 24 hours of completion.</p><h3>Cancellations</h3><p>Bookings can be cancelled up to 12 hours before the scheduled time for a full refund.</p>' },
  { slug: 'testimonials', title: 'Client Testimonials', content: '<h2>What Our Customers Say</h2><p>Smart Clean has served over 1,000+ happy clients across Dhaka. Here is what some of them have to say:</p><div class="bg-gray-50 p-6 rounded-xl italic">"Excellent service! The team was very professional and left my home spotless." - Sarah J.</div>' },
  { slug: 'faq', title: 'Frequently Asked Questions', content: '<h2>Got Questions? We Have Answers.</h2><h3>How do I book a service?</h3><p>You can book directly through our website or mobile app by selecting a service and choosing a time slot.</p><h3>Which areas do you cover?</h3><p>Currently, we operate in major areas of Dhaka city, including Uttara, Gulshan, Banani, and Dhanmondi.</p>' }
];

export default function PagesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const pagesQuery = useMemoFirebase(() => db ? query(collection(db, 'pages_management'), orderBy('slug', 'asc')) : null, [db]);
  const { data: pages, isLoading } = useCollection(pagesQuery);

  const filtered = pages?.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSeedDefaults = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      let createdCount = 0;
      for (const page of DEFAULT_PAGES) {
        // Check if slug exists
        const q = query(collection(db, 'pages_management'), where('slug', '==', page.slug));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          await addDoc(collection(db, 'pages_management'), {
            ...page,
            isPublished: true,
            updatedAt: new Date().toISOString()
          });
          createdCount++;
        }
      }
      toast({ title: "CMS Sync Complete", description: `Initialized ${createdCount} default system pages.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this page? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'pages_management', id));
      toast({ title: "Page Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error deleting page" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Pages Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Control dynamic content and informational pages</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSeedDefaults} 
            disabled={isSeeding} 
            className="gap-2 font-bold h-11 px-6 rounded-xl border-primary/20 text-primary hover:bg-primary/5"
          >
            {isSeeding ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Initialize Defaults
          </Button>
          <Button asChild className="gap-2 font-bold h-11 px-6 rounded-xl shadow-lg">
            <Link href="/admin/pages/new">
              <Plus size={18} /> Create New Page
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by title or slug (e.g. faq, testimonials)..." 
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
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">
                    <div className="flex flex-col items-center gap-4">
                      <Sparkles size={40} className="text-gray-200" />
                      <p>No pages found. Click "Initialize Defaults" to set up your core pages.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
