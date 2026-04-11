
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Save, 
  Users, 
  Wrench, 
  CheckCircle2, 
  Phone, 
  Mail, 
  GraduationCap,
  Banknote,
  Briefcase,
  Search,
  Filter,
  Star,
  MoreVertical,
  Eye,
  UserCheck,
  TrendingUp,
  X,
  ChevronDown,
  Clock,
  ShieldCheck,
  Award,
  Zap
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  // Unified Controlled Form State
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Field Technician',
    department: 'Operations',
    salaryModel: 'monthly',
    baseRate: 0,
    commissionRate: 0,
    status: 'Active',
    skills: [] as string[]
  });

  const employeesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'employee_profiles')) : null, [db, user]);
  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db, user]);

  const { data: employees, isLoading } = useCollection(employeesQuery);
  const { data: services } = useCollection(servicesQuery);

  const filteredStaff = useMemo(() => {
    if (!employees) return [];
    
    return employees.filter(staff => {
      const name = (staff.name || "").toLowerCase();
      const phone = (staff.phone || "");
      const department = staff.department || "Operations";
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = name.includes(search) || phone.includes(search);
      const matchesDept = filterDept === 'all' || department === filterDept;
      
      return matchesSearch && matchesDept;
    }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [employees, searchTerm, filterDept]);

  const stats = useMemo(() => {
    if (!employees) return { total: 0, active: 0, payroll: 0 };
    return {
      total: employees.length,
      active: employees.filter(e => e.status === 'Active').length,
      payroll: employees.reduce((acc, curr) => acc + (curr.baseRate || 0), 0)
    };
  }, [employees]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const staffData = {
      ...formValues,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'employee_profiles', editingStaff.id), staffData);
        toast({ title: "Profile Updated" });
      } else {
        await addDoc(collection(db, 'employee_profiles'), { 
          ...staffData, 
          rating: 5.0, 
          jobsCompleted: 0, 
          createdAt: new Date().toISOString() 
        });
        toast({ title: "Personnel Enrolled" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Data" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormValues({
      name: '',
      email: '',
      phone: '',
      role: 'Field Technician',
      department: 'Operations',
      salaryModel: 'monthly',
      baseRate: 0,
      commissionRate: 0,
      status: 'Active',
      skills: []
    });
  };

  const handleOpenEdit = (staff: any) => {
    setEditingStaff(staff);
    setFormValues({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      role: staff.role || 'Field Technician',
      department: staff.department || 'Operations',
      salaryModel: staff.salaryModel || 'monthly',
      baseRate: staff.baseRate || 0,
      commissionRate: staff.commissionRate || 0,
      status: staff.status || 'Active',
      skills: staff.skills || []
    });
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Permanently remove this personnel?")) return;
    await deleteDoc(doc(db, 'employee_profiles', id));
    toast({ title: "Personnel Removed" });
  };

  const toggleSkill = (serviceId: string) => {
    setFormValues(prev => ({
      ...prev,
      skills: prev.skills.includes(serviceId) 
        ? prev.skills.filter(id => id !== serviceId) 
        : [...prev.skills, serviceId]
    }));
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">HRM - Staff Directory</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage workforce, roles, and automated payroll models</p>
        </div>
        
        <Button onClick={handleOpenNew} className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl font-black uppercase text-xs tracking-widest gap-3">
          <Plus size={20} /> Hire New Personnel
        </Button>

        {/* 🛠️ IMPROVED SCROLLABLE DIALOG */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) setIsDialogOpen(false); }}>
          <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-hidden p-0 border-none rounded-none md:rounded-[2.5rem] shadow-2xl flex flex-col bg-white">
            <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden" key={editingStaff?.id || 'new'}>
              <DialogHeader className="bg-[#081621] text-white p-6 md:p-8 shrink-0 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                    <Users className="text-primary" /> {editingStaff ? 'Update Profile' : 'Staff Enrollment'}
                  </DialogTitle>
                  <DialogDescription className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Identity, payroll and certified skills</DialogDescription>
                </div>
                <button type="button" onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
                  <X size={24} />
                </button>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-white">
                <Tabs defaultValue="identity" className="w-full">
                  <TabsList className="bg-gray-100 p-1 rounded-xl mb-10 w-fit shrink-0">
                    <TabsTrigger value="identity" className="rounded-lg gap-2 text-[10px] font-black uppercase px-6">Identity</TabsTrigger>
                    <TabsTrigger value="payroll" className="rounded-lg gap-2 text-[10px] font-black uppercase px-6">Payroll & Role</TabsTrigger>
                    <TabsTrigger value="skills" className="rounded-lg gap-2 text-[10px] font-black uppercase px-6">Skills</TabsTrigger>
                  </TabsList>

                  <TabsContent value="identity" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                        <Input value={formValues.name} onChange={e => setFormValues({...formValues, name: e.target.value})} required placeholder="Full Legal Name" className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Official Email</Label>
                        <Input type="email" value={formValues.email} onChange={e => setFormValues({...formValues, email: e.target.value})} required placeholder="email@smartclean.com" className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone</Label>
                        <Input value={formValues.phone} onChange={e => setFormValues({...formValues, phone: e.target.value})} required placeholder="+880" className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Department</Label>
                        <Select value={formValues.department} onValueChange={v => setFormValues({...formValues, department: v})}>
                          <SelectTrigger className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Operations">Operations</SelectItem>
                            <SelectItem value="Logistics">Logistics</SelectItem>
                            <SelectItem value="Sales">Sales & Marketing</SelectItem>
                            <SelectItem value="Finance">Accounts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="payroll" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Salary Model</Label>
                        <Select value={formValues.salaryModel} onValueChange={v => setFormValues({...formValues, salaryModel: v})}>
                          <SelectTrigger className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-black text-primary uppercase text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="daily">Daily Wage</SelectItem>
                            <SelectItem value="monthly">Fixed Monthly</SelectItem>
                            <SelectItem value="hybrid">Hybrid (Base + %)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Base Rate (৳)</Label>
                          <Input type="number" value={formValues.baseRate} onChange={e => setFormValues({...formValues, baseRate: parseFloat(e.target.value) || 0})} className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-black" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Commission (%)</Label>
                          <Input type="number" value={formValues.commissionRate} onChange={e => setFormValues({...formValues, commissionRate: parseFloat(e.target.value) || 0})} className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-black" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Status</Label>
                        <Select value={formValues.status} onValueChange={v => setFormValues({...formValues, status: v})}>
                          <SelectTrigger className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="On Leave">On Leave</SelectItem>
                            <SelectItem value="Suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Designated Role</Label>
                        <Input value={formValues.role} onChange={e => setFormValues({...formValues, role: e.target.value})} className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-6 md:p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                      <div className="flex items-center gap-2 mb-6">
                        <GraduationCap className="text-primary" size={20} />
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Certified Expertise</Label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services?.map((service) => (
                          <div 
                            key={service.id} 
                            onClick={() => toggleSkill(service.id)}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer group bg-white",
                              formValues.skills.includes(service.id) ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/20"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                              formValues.skills.includes(service.id) ? "bg-primary border-primary text-white" : "border-gray-200"
                            )}>
                              {formValues.skills.includes(service.id) && <CheckCircle2 size={14} strokeWidth={4} />}
                            </div>
                            <span className="text-[10px] font-bold uppercase truncate">{service.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none h-12 md:h-14 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl font-black px-12 h-12 md:h-14 shadow-xl bg-primary hover:bg-primary/90 text-white uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-primary/20">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync Records</>}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Total Personnel</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{stats.total}</h3>
            </div>
            <div className="p-5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Users size={32} strokeWidth={2.5} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Active Field Duty</p>
              <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">{stats.active}</h3>
            </div>
            <div className="p-5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <UserCheck size={32} strokeWidth={2.5} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Payroll Volume</p>
              <h3 className="text-4xl font-black text-indigo-600 tracking-tighter">৳{(stats.payroll / 1000).toFixed(1)}K</h3>
            </div>
            <div className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Banknote size={32} strokeWidth={2.5} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by personnel name or phone..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-2xl transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="h-12 w-full md:w-48 bg-gray-50 border-none rounded-2xl font-black uppercase text-[10px] px-6">
              <div className="flex items-center gap-2"><Filter size={14}/> <SelectValue placeholder="Department" /></div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Depts</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Logistics">Logistics</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-6 pl-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Employee Identity</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Contact</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Model & Rate</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Department</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Performance</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Status</TableHead>
                  <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-10 py-6"><div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-2xl" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></TableCell>
                      <TableCell colSpan={6}><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="py-6 pl-10">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => handleOpenEdit(staff)}>
                            <AvatarFallback className="bg-primary text-white font-black text-sm uppercase">{staff.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 uppercase text-xs truncate leading-tight mb-1">{staff.name || 'Unnamed'}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-none text-[8px] font-black uppercase h-4 px-1.5">{staff.role || 'Personnel'}</Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-primary/10 hover:text-primary"><Phone size={14} /></Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-900 text-white border-none rounded-lg text-[10px] font-bold">{staff.phone}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-primary/10 hover:text-primary"><Mail size={14} /></Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-900 text-white border-none rounded-lg text-[10px] font-bold">{staff.email}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none">{staff.salaryModel}</p>
                          <p className="font-black text-gray-900 text-sm tracking-tight">৳{staff.baseRate?.toLocaleString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><Briefcase size={12}/></div>
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{staff.department || 'Operations'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-[10px] font-black text-gray-900">{(staff.rating || 5.0).toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-12 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: '85%' }} /></div>
                            <span className="text-[8px] font-black text-muted-foreground uppercase">{staff.jobsCompleted || 0} JOBS</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[8px] font-black uppercase border-none px-3 py-1 rounded-lg shadow-sm",
                          staff.status === 'Active' ? "bg-emerald-50 text-emerald-700" :
                          staff.status === 'On Leave' ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        )}>
                          {staff.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl" onClick={() => handleOpenEdit(staff)}><Edit size={16} /></Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-[9px] font-black uppercase">Edit Records</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(staff.id)}><Trash2 size={16} /></Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-[9px] font-black uppercase">Purge Entry</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                        <div className="p-6 bg-gray-50 rounded-full text-gray-200">
                          <Zap size={64} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-black uppercase text-gray-900">No Personnel Found</h4>
                          <p className="text-xs text-muted-foreground font-medium">No records match your current filter criteria.</p>
                        </div>
                        {searchTerm && (
                          <Button variant="outline" size="sm" onClick={() => setSearchTerm('')} className="mt-4 font-black uppercase text-[10px]">Clear Search</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
