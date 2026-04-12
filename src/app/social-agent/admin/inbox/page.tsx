
'use client';

import React, { useState } from 'react';
import { 
  Search, 
  MessageCircle, 
  User, 
  Send, 
  Bot, 
  ShieldAlert, 
  ArrowLeft,
  MoreVertical,
  Phone,
  Mail,
  Zap,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Isolated Unified Live Inbox
 */
export default function UnifiedInboxPage() {
  const [activeChat, setActiveChat] = useState<any>(null);
  const [reply, setReply] = useState('');

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* Chat List Sidebar */}
      <aside className="w-80 md:w-96 border-r border-gray-100 flex flex-col shrink-0">
        <header className="p-6 border-b border-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-tight">Inbox</h2>
            <Link href="/social-agent/admin" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><ArrowLeft size={20}/></Link>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input placeholder="Search chats..." className="h-10 pl-9 bg-gray-50 border-none rounded-xl text-xs" />
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              onClick={() => setActiveChat({ id: i, name: "Customer #" + i })}
              className={cn(
                "p-6 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50",
                activeChat?.id === i && "bg-emerald-50/50 border-l-4 border-l-emerald-600"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400">C</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-bold text-sm text-gray-900 truncate">Siam Ahmed</p>
                  <span className="text-[8px] font-black text-gray-400 uppercase">2m ago</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate leading-none">রেট চার্টটা কি দেওয়া যাবে?</p>
                <div className="mt-2 flex gap-1">
                  <Badge className="bg-emerald-50 text-emerald-600 border-none text-[7px] font-black uppercase px-1.5 h-4">WHATSAPP</Badge>
                  <Badge className="bg-blue-50 text-blue-600 border-none text-[7px] font-black uppercase px-1.5 h-4">AI ACTIVE</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Conversation Area */}
      <main className="flex-1 flex flex-col bg-gray-50/30">
        {activeChat ? (
          <>
            <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">S</div>
                <div>
                  <h3 className="font-black uppercase text-sm leading-none">Siam Ahmed</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Via WhatsApp</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase border-gray-200">Take Over</Button>
                <Button variant="ghost" size="icon" className="text-gray-400"><MoreVertical size={20}/></Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="flex gap-4 max-w-[70%]">
                <div className="p-2 h-8 w-8 bg-gray-200 rounded-lg flex items-center justify-center shrink-0"><User size={16}/></div>
                <div className="p-4 bg-white rounded-2xl shadow-sm border text-sm leading-relaxed">
                  আসসালামু আলাইকুম। আমি সোফা ক্লিন করতে চাই। রেট কত?
                </div>
              </div>
              <div className="flex gap-4 max-w-[70%] ml-auto flex-row-reverse">
                <div className="p-2 h-8 w-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0"><Bot size={16}/></div>
                <div className="p-4 bg-[#081621] text-white rounded-2xl shadow-lg text-sm leading-relaxed">
                  ওয়ালাইকুম আসসালাম! আমাদের সোফা ক্লিনিং শুরু মাত্র ৮০০ টাকা থেকে। আপনি কয়টি সিট ক্লিন করতে চান তা জানালে আমি সঠিক রেটটি বলতে পারবো।
                </div>
              </div>
            </div>

            <footer className="p-8 bg-white border-t border-gray-100">
              <div className="relative">
                <Input 
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Send a manual reply (This will pause AI)..." 
                  className="h-14 pl-6 pr-16 bg-gray-100 border-none rounded-2xl font-medium focus:bg-white transition-all shadow-inner"
                />
                <Button className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-xl shadow-xl bg-emerald-600 hover:bg-emerald-700">
                  <Send size={18} />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-4">
            <MessageCircle size={80} strokeWidth={1} />
            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Select a conversation to start</p>
          </div>
        )}
      </main>

      {/* Info Sidebar */}
      {activeChat && (
        <aside className="w-80 border-l border-gray-100 bg-white p-8 hidden xl:block">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 mx-auto flex items-center justify-center">
                <User size={40} className="text-gray-300" />
              </div>
              <div>
                <h4 className="font-black text-lg uppercase tracking-tight">Siam Ahmed</h4>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Verified Lead</p>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-[9px] font-black uppercase text-gray-400 tracking-widest border-b pb-2">Captured Intelligence</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone size={14} className="text-emerald-600"/>
                  <span className="text-xs font-bold">01712-XXXXXX</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Zap size={14} className="text-amber-500"/>
                  <span className="text-xs font-bold">Sofa Cleaning</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#081621] rounded-3xl text-white space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">Quick Actions</h5>
              <Button className="w-full h-10 rounded-xl bg-white text-[#081621] font-black uppercase text-[9px] tracking-widest">Create Lead</Button>
              <Button variant="outline" className="w-full h-10 rounded-xl bg-white/5 border-white/10 text-white font-black uppercase text-[9px] tracking-widest">Mark Resolved</Button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
