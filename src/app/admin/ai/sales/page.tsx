
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Zap, 
  Sparkles,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { runCRMAgent } from '@/ai/flows/crm-agent-flow';
import { useToast } from '@/hooks/use-toast';

export default function AISalesDeskPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, action?: string }[]>([]);
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
        agentType: 'sales',
        context: 'We are Smart Clean, offering Home, Office, and Deep Cleaning services starting from 5000 BDT.'
      });

      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: result.response,
        action: result.suggestedAction 
      }]);
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "The sales agent is currently resting." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">AI Sales Desk</h1>
          <p className="text-muted-foreground text-sm font-medium">Interactive sales agent for pitching and lead qualification</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-primary/10 text-primary border-none uppercase font-black text-[9px] px-3 py-1">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" /> Gemini 2.0 Engine
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
        {/* Chat Console */}
        <Card className="lg:col-span-8 flex flex-col border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-[#081621] text-white p-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl text-primary"><Bot size={24} /></div>
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">Sales Agent Alpha</CardTitle>
                <CardDescription className="text-white/40 text-[10px] uppercase font-bold">Real-time Lead Simulation</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/50">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <Sparkles size={48} className="text-primary" />
                <p className="text-xs font-bold uppercase tracking-widest max-w-[200px]">Ask the agent to pitch services or qualify a lead</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn(
                "flex gap-4 max-w-[85%]",
                m.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}>
                <div className={cn(
                  "p-2 h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  m.role === 'ai' ? "bg-primary text-white" : "bg-white text-gray-400 shadow-sm"
                )}>
                  {m.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="space-y-2">
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                    m.role === 'ai' ? "bg-white text-gray-900 shadow-sm border border-gray-100" : "bg-[#081621] text-white"
                  )}>
                    {m.content}
                  </div>
                  {m.action && (
                    <div className="flex items-center gap-2 p-2 px-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 w-fit">
                      <Zap size={12} fill="currentColor" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Action: {m.action}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="p-2 h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center animate-pulse"><Bot size={20} /></div>
                <div className="p-4 bg-white rounded-2xl shadow-sm border flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t shrink-0">
            <form onSubmit={handleChat} className="relative group">
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Test the agent: 'Why should I choose Smart Clean over competitors?'"
                className="h-14 pl-6 pr-16 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !query.trim()} 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl p-0"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </Card>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-primary text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><BrainCircuit size={120} /></div>
            <CardHeader className="relative z-10"><CardTitle className="text-base font-bold uppercase tracking-widest">Capabilities</CardTitle></CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {[
                "Instant Service Pitching",
                "Pricing Negotiation Mock",
                "Phone/Email Extraction",
                "Competitor Comparison"
              ].map((cap, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-bold bg-white/10 p-3 rounded-xl border border-white/5">
                  <CheckCircle2 size={14} className="text-white" /> {cap}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-6 px-8">
              <CardTitle className="text-base font-bold flex items-center gap-2"><TrendingUp size={18} className="text-primary" /> Training Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                  <span>Context Match</span>
                  <span>98%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[98%]" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                  <span>Tone Score</span>
                  <span>Professional</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[90%]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
