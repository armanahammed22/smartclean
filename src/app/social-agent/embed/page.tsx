
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Loader2, 
  CheckCircle2, 
  Phone,
  Zap,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { processSocialMessage } from '@/ai/flows/social-agent-logic';

/**
 * Standalone Messaging Widget (Plug-and-play via iframe)
 */
export default function SocialAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: 'আসসালামু আলাইকুম! আমি স্মার্ট ক্লিন এআই অ্যাসিস্ট্যান্ট। আপনাকে কীভাবে সাহায্য করতে পারি?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setQuery('');
    setIsLoading(true);

    try {
      const result = await processSocialMessage({
        message: userMsg,
        history: messages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', content: m.content }))
      });

      setMessages(prev => [...prev, { role: 'ai', content: result.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'দুঃখিত, আমি এই মুহূর্তে কানেক্ট হতে পারছি না। দয়া করে কিছুক্ষণ পর চেষ্টা করুন।' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans antialiased">
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-[#075E54] text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 group relative"
        >
          <div className="absolute inset-0 rounded-full bg-[#075E54] animate-ping opacity-20" />
          <MessageCircle size={32} />
          <BadgeCheck className="absolute -top-1 -right-1 text-emerald-400 bg-white rounded-full border-2 border-white" size={20} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[550px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
          <header className="bg-[#075E54] p-6 text-white shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                  <Bot size={24} />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full" />
              </div>
              <div>
                <h3 className="font-black uppercase text-xs tracking-tight">Smart Agent</h3>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Active & Ready</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                <div className={cn("p-2 h-8 w-8 rounded-lg flex items-center justify-center shrink-0", m.role === 'ai' ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500")}>
                  {m.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                  m.role === 'ai' ? "bg-white text-gray-900 shadow-sm border border-gray-100" : "bg-[#081621] text-white"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="p-2 h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center animate-pulse"><Bot size={16} /></div>
                <div className="p-4 bg-white rounded-2xl shadow-sm border flex gap-1 items-center">
                  <div className="w-1 h-1 rounded-full bg-gray-300 animate-bounce" />
                  <div className="w-1 h-1 rounded-full bg-gray-300 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 rounded-full bg-gray-300 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <footer className="p-6 bg-white border-t shrink-0">
            <form onSubmit={handleSend} className="relative">
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your message..."
                className="h-12 pl-5 pr-14 bg-gray-100 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-xs"
              />
              <button 
                type="submit" 
                disabled={isLoading || !query.trim()} 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
            <p className="text-[8px] text-center text-gray-400 mt-4 font-black uppercase tracking-[0.2em]">AI Agent Powered by Smart Clean</p>
          </footer>
        </div>
      )}
    </div>
  );
}

function BadgeCheck({ className, size }: { className?: string, size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
