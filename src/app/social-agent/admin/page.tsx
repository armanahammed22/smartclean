
'use client';

import React from 'react';
import { 
  BarChart3, 
  MessageCircle, 
  Users, 
  Zap, 
  Bot, 
  TrendingUp, 
  Settings, 
  ArrowRight,
  ShieldCheck,
  Activity,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Social Messaging Admin Dashboard
 */
export default function SocialAgentAdminPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 bg-[#F8FAFC] min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Messaging Hub</h1>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <Bot className="text-primary" size={16}/> Automated Social Engagement AI
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-gray-200">
            <Settings size={18} className="mr-2" /> Global Config
          </Button>
          <Button className="rounded-xl h-11 px-8 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 bg-[#075E54]">
            Live Site Preview
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Conversations", val: "142", icon: MessageCircle, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "New Leads Captured", val: "28", icon: Users, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "AI Response Rate", val: "98.4%", icon: Zap, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Handovers Pending", val: "5", icon: ShieldCheck, bg: "bg-rose-50", color: "text-rose-600" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-gray-900">{stat.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", stat.bg, stat.color)}><stat.icon size={24} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase">Recent Activity</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-primary">Live stream from Messenger & WhatsApp</CardDescription>
              </div>
              <Button variant="ghost" asChild className="text-primary font-black uppercase text-[10px]"><Link href="/social-agent/admin/inbox">Open Inbox <ArrowRight size={14} className="ml-1" /></Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {[
                  { user: "Ariful Islam", platform: "WhatsApp", time: "2m ago", last: "ক্লিনিং এর রেট কত?", status: "AI Replied" },
                  { user: "Sarah Jahan", platform: "Messenger", time: "15m ago", last: "বুকিং করতে চাই।", status: "Lead Captured" },
                  { user: "Rakib Hassan", platform: "WhatsApp", time: "1h ago", last: "কাল কি স্লট খালি আছে?", status: "Handoff Needed" }
                ].map((chat, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">{chat.user[0]}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-gray-900">{chat.user}</p>
                          <Badge variant="outline" className="text-[7px] font-black uppercase border-none bg-gray-100">{chat.platform}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 italic">"{chat.last}"</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase">{chat.time}</p>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase border-none px-2",
                        chat.status === 'AI Replied' ? "bg-blue-50 text-blue-600" :
                        chat.status === 'Lead Captured' ? "bg-green-50 text-green-700" :
                        "bg-rose-50 text-rose-700"
                      )}>{chat.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2.5rem] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150 group-hover:scale-125 transition-transform"><Zap size={120} /></div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tight text-primary flex items-center gap-2"><Sparkles size={20}/> Automation Builder</h3>
              <p className="text-white/60 text-sm leading-relaxed font-medium">Create complex conditional flows without writing a single line of code.</p>
              <div className="space-y-3">
                {[
                  { label: "Welcome Sequence", steps: "4 Steps" },
                  { label: "Lead Qualification", steps: "6 Steps" },
                  { label: "Post-Job Feedback", steps: "3 Steps" }
                ].map((flow, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center hover:bg-white/10 transition-colors cursor-pointer">
                    <span className="text-xs font-bold">{flow.label}</span>
                    <span className="text-[9px] font-black text-primary uppercase">{flow.steps}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary shadow-lg"><Link href="/social-agent/admin/flows">Manage All Flows</Link></Button>
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8 border border-gray-100">
            <CardTitle className="text-base font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2"><Activity size={18} /> Engine Stats</CardTitle>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>Match Quality</span><span>94%</span></div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary w-[94%]" /></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>Handover Required</span><span>12%</span></div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-rose-500 w-[12%]" /></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
