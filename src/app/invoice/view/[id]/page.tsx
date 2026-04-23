
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import { 
  CheckCircle2, 
  Download, 
  Loader2, 
  MapPin, 
  Phone, 
  Globe,
  Mail,
  Facebook,
  Instagram,
  Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { downloadInvoicePDF } from '@/lib/invoice-utils';

export default function PublicInvoiceViewPage() {
  const { id } = useParams();
  const db = useFirestore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const invoiceRef = useMemoFirebase(() => (db && id) ? doc(db, 'invoices', id as string) : null, [db, id]);
  const { data: invoice, isLoading } = useDoc(invoiceRef);

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center p-8 text-center uppercase font-black opacity-20">Secure Document Not Found</div>;

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 flex flex-col items-center">
        
        {/* Document Actions */}
        <div className="w-full max-w-[210mm] flex justify-between items-center mb-8 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#081621] rounded-lg flex items-center justify-center text-white font-black text-xs">SC</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#081621]">Public Portal</span>
          </div>
          <Button 
            className="rounded-full gap-2 font-black uppercase text-[10px] h-10 px-8 bg-[#1E5F7A] shadow-xl"
            onClick={() => { setIsDownloading(true); downloadInvoicePDF('public-invoice-render', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={14} />} SAVE AS PDF
          </Button>
        </div>

        {/* 📄 CORPORATE INVOICE RENDER AREA */}
        <div 
          id="public-invoice-render" 
          className="bg-white shadow-2xl overflow-hidden relative"
          style={{ width: '210mm', minHeight: '297mm', color: '#333' }}
        >
          {/* Header Graphics */}
          <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-2 z-10 text-[10px] font-bold text-[#1E5F7A]">
            <div className="flex items-center gap-2"><Phone size={12}/> 01919640422</div>
            <div className="flex items-center gap-2"><Mail size={12}/> smartclean422@gmail.com</div>
            <div className="flex items-center gap-2"><Globe size={12}/> smartclean.bd</div>
          </div>

          <div className="pt-8 px-12 relative">
             <div className="flex items-start gap-4 mb-8">
                <div className="w-16 h-16 relative">
                   <Image src="https://picsum.photos/seed/smartclean-logo/512/512" alt="Logo" fill className="object-contain" unoptimized />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#1E5F7A] tracking-tighter italic leading-none">Smart Clean</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Professional Cleaning Services</p>
                </div>
             </div>

             {/* Wave Graphics */}
             <div className="absolute top-24 left-0 right-0 h-12 pointer-events-none opacity-20">
                <svg viewBox="0 0 1440 320" className="w-full h-full"><path fill="#22C55E" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>
                <svg viewBox="0 0 1440 320" className="w-full h-full -mt-6"><path fill="#1E5F7A" d="M0,192L60,181.3C120,171,240,149,360,160C480,171,600,213,720,218.7C840,224,960,192,1080,181.3C1200,171,1320,181,1380,186.7L1440,192L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path></svg>
             </div>
          </div>

          <div className="px-16 pt-16 space-y-12">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-black text-gray-900">To,</p>
                  <p className="text-lg font-black text-[#081621] uppercase leading-none">{invoice.customerInfo.name}</p>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[250px]">{invoice.customerInfo.address}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-black text-gray-900">Date: {format(new Date(invoice.createdAt), 'dd-MM-yyyy')}</p>
                  <p className="text-sm font-black text-[#1E5F7A]">Ref: {invoice.invoiceNumber}</p>
                </div>
             </div>

             <div className="text-center">
                <h3 className="text-xl font-black uppercase text-[#1E5F7A] border-b-2 border-[#1E5F7A] inline-block pb-1 tracking-tight">
                  {invoice.projectId ? 'QUOTATION FOR CLEANING SERVICE.' : 'OFFICIAL SALES INVOICE.'}
                </h3>
             </div>

             <div className="overflow-hidden border-2 border-black rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-[#00A8B5] text-white">
                    <tr>
                      <th className="py-2 px-3 text-[10px] font-black border-r border-black uppercase w-12">SL.</th>
                      <th className="py-2 px-3 text-[10px] font-black border-r border-black uppercase text-left">Service</th>
                      <th className="py-2 px-3 text-[10px] font-black border-r border-black uppercase text-left">Description/Specifications</th>
                      <th className="py-2 px-3 text-[10px] font-black border-r border-black uppercase w-24">Area (sqft)</th>
                      <th className="py-2 px-3 text-[10px] font-black uppercase w-28">Rate (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-medium">
                    {invoice.items.map((item: any, i: number) => (
                      <tr key={i} className="border-t border-black">
                        <td className="py-4 text-center border-r border-black font-black">{i + 1}</td>
                        <td className="py-4 px-3 border-r border-black font-black uppercase">{item.name}</td>
                        <td className="py-4 px-3 border-r border-black">
                          <p className="font-black text-[#1E5F7A] mb-1">Scope of Work:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>Full cleanup with professional machine</li>
                            <li>Chemical treatment for spots</li>
                            <li>Sanitization & Finishing</li>
                          </ul>
                        </td>
                        <td className="py-4 text-center border-r border-black font-black">{item.quantity > 1 ? item.quantity : 'Per Job'}</td>
                        <td className="py-4 text-center font-black">{item.price}/-</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-black bg-gray-50">
                      <td colSpan={3} className="py-2 px-4 text-right font-black uppercase text-[10px] border-r border-black">Total Net Payable</td>
                      <td colSpan={2} className="py-2 px-4 text-center font-black text-sm">৳{invoice.total.toLocaleString()} /-</td>
                    </tr>
                  </tbody>
                </table>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-[#1E5F7A] border-b border-dashed border-[#1E5F7A] w-fit">Terms & Conditions:</h4>
                  <ul className="space-y-1 text-[10px] font-bold text-gray-600">
                    <li className="flex gap-2">➤ Offer validity is for 07 days from date of submission.</li>
                    <li className="flex gap-2">➤ Water and electricity must be provided by client</li>
                    <li className="flex gap-2">➤ Area should be cleared before service</li>
                    <li className="flex gap-2">➤ Extra charges may apply for heavy stains</li>
                  </ul>
                </div>

                <div className="pt-8">
                   <p className="text-xs font-black text-[#1E5F7A] italic mb-4">With Best Regards</p>
                   <div className="space-y-1">
                      <p className="font-black text-sm uppercase">Md. Shipon</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">Proprietor</p>
                      <p className="text-[10px] font-black text-[#1E5F7A] uppercase">Smart Clean</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">Mobile: +88-01919-640422</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Bottom Footer */}
          <div className="absolute bottom-0 left-0 right-0 h-16 border-t-2 border-[#1E5F7A] px-12 flex items-center justify-between bg-white">
             <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#1E5F7A]" />
                <p className="text-[10px] font-black text-gray-600 uppercase">GP.Ja-66/2, Wireless Gate, Mohakhali, Dhaka-1212</p>
             </div>
             <div className="flex gap-3 grayscale opacity-40">
                <Facebook size={16}/>
                <Instagram size={16}/>
                <Linkedin size={16}/>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
