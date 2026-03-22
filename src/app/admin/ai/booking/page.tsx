
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarCheck, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Zap, 
  Clock,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { runCRMAgent } from '@/ai/flows/crm-agent-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AIBookingAssistantPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, lead?: any }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setQuery('');
    setIsLoading(true);

    try {
      const result = await runCRMAgent({
        userQuery: userMsg,
        agentType: 'booking',
        context: 'Help the user select a date and cleaning service.'
      });

      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: result.response,
        lead: result.capturedLead
      }]);
    } catch (error) {
      toast({ variant: "destructive", title: "Assistant Error", description: "AI is currently offline." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">AI Booking Assistant</h1>
          <p className="text-muted-foreground text-sm font-medium">Smart intake agent for capturing customer details and appointment intent</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
        {/* Chat Area */}
        <Card className="lg:col-span-8 flex flex-col border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-indigo-600 text-white p-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl"><CalendarCheck size={24} /></div>
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">Intake Bot Beta</CardTitle>
                <CardDescription className="text-white/60 text-[10px] uppercase font-bold">Dynamic Scheduling Simulation</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-indigo-50/20">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <Clock size={48} className="text-indigo-600" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px]">Simulate a customer booking inquiry below</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn(
                "flex gap-4 max-w-[85%]",
                m.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}>
                <div className={cn(
                  "p-2 h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  m.role === 'ai' ? "bg-indigo-600 text-white" : "bg-white text-gray-400 shadow-sm"
                )}>
                  {m.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="space-y-3">
                  <div className={cn(
                    "p-5 rounded-2xl text-sm font-medium leading-relaxed",
                    m.role === 'ai' ? "bg-white text-gray-900 shadow-sm border border-indigo-100" : "bg-[#081621] text-white shadow-xl shadow-black/10"
                  )}>
                    {m.content}
                  </div>
                  {m.lead && (Object.keys(m.lead).some(k => !!m.lead[k])) && (
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100 animate-in zoom-in-95">
                      <p className="text-[9px] font-black text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={10} fill="currentColor" /> Lead Data Captured</p>
                      <div className="grid grid-cols-2 gap-4">
                        {m.lead.name && <div className="text-[10px] font-bold text-gray-600">Name: <span className="text-gray-900">{m.lead.name}</span></div>}
                        {m.lead.phone && <div className="text-[10px] font-bold text-gray-600">Phone: <span className="text-gray-900">{m.lead.phone}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="p-2 h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center animate-pulse"><Bot size={20} /></div>
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-indigo-50 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          <div className="p-8 bg-white border-t shrink-0">
            <form onSubmit={handleChat} className="relative">
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Simulate: 'Hi, I want to book a deep cleaning for tomorrow morning...'"
                className="h-16 pl-8 pr-20 bg-gray-50 border-none rounded-3xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium shadow-inner"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !query.trim()} 
                className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl p-0 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20"
              >
                <Send size={20} />
              </Button>
            </form>
          </div>
        </Card>

        {/* Info Area */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><ClipboardList size={120} /></div>
            <CardHeader className="relative z-10 p-8 pb-4">
              <CardTitle className="text-base font-black uppercase tracking-widest text-indigo-400">Intake Process</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-8 pt-0 space-y-6">
              <div className="space-y-4">
                {[
                  { step: 1, label: "Identify Intent" },
                  { step: 2, label: "Select Category" },
                  { step: 3, label: "Capture Schedule" },
                  { step: 4, label: "Extract Contact" }
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">{s.step}</div>
                    <span className="text-xs font-bold opacity-60 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] text-white/40 italic leading-relaxed">
                  The bot uses advanced NER (Named Entity Recognition) to pull dates and times from casual conversation.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100/50 space-y-4">
            <div className="p-3 bg-white rounded-2xl w-fit shadow-sm text-indigo-600"><Sparkles size={24} /></div>
            <h3 className="text-lg font-black text-indigo-900 uppercase tracking-tight">Lead Extraction</h3>
            <p className="text-xs text-indigo-800/60 leading-relaxed font-medium">
              This assistant is optimized to automatically flag "Action Items" when it detects phone numbers or specific intent, creating a "Warm Lead" in your CRM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
