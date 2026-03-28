
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Loader2, 
  BadgeCheck, 
  Users, 
  Settings, 
  Save, 
  Search, 
  Download, 
  Filter,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Lock,
  Mail,
  Zap,
  MoreVertical,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from '@/components/ui/switch';

const PERMISSION_LIST = [
  { id: 'dashboard.view', label: 'View Dashboard', group: 'General' },
  { id: 'orders.view', label: 'View Orders', group: 'Sales' },
  { id: 'orders.edit', label: 'Update Orders', group: 'Sales' },
  { id: 'orders.delete', label: 'Delete Orders', group: 'Sales' },
  { id: 'bookings.view', label: 'View Bookings', group: 'Service' },
  { id: 'bookings.edit', label: 'Update Bookings', group: 'Service' },
  { id: 'inventory.manage', label: 'Manage Products', group: 'Inventory' },
  { id: 'crm.view', label: 'View Customers', group: 'CRM' },
  { id: 'crm.manage', label: 'Edit Customers', group: 'CRM' },
  { id: 'reports.view', label: 'View Reports', group: 'Admin' },
  { id: 'settings.access', label: 'System Settings', group: 'Admin' },
];

export default function AccessControlPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog States
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form States
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] as string[], status: 'Active' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', roleId: 'employees', status: 'active' });

  // Data Queries
  const rolesQuery = useMemoFirebase(() => db ? query(collection(db, 'roles_management'), orderBy('name', 'asc')) : null, [db]);
  const usersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '!=', 'customer'), orderBy('role', 'asc')) : null, [db]);
  
  const { data: roles, isLoading: rLoading } = useCollection(rolesQuery);
  const { data: staffUsers, isLoading: uLoading } = useCollection(usersQuery);

  // KPI Calculations
  const stats = useMemo(() => {
    if (!staffUsers || !roles) return { admin: 0, manager: 0, technician: 0, activeRoles: 0, inactiveRoles: 0 };
    return {
      admin: staffUsers.filter(u => u.role === 'admin' || u.role === 'admins').length,
      manager: staffUsers.filter(u => u.role === 'manager' || u.role === 'managers').length,
      technician: staffUsers.filter(u => u.role === 'staff' || u.role === 'employees').length,
      activeRoles: roles.filter(r => r.status === 'Active').length,
      inactiveRoles: roles.filter(r => r.status === 'Inactive').length
    };
  }, [staffUsers, roles]);

  const handleSaveRole = async () => {
    if (!db || !roleForm.name) return;
    setIsSubmitting(true);
    try {
      const roleId = editingRole?.id || roleForm.name.toLowerCase().replace(/\s+/g, '_');
      await setDoc(doc(db, 'roles_management', roleId), {
        ...roleForm,
        id: roleId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast({ title: "Role Configuration Sync", description: "Permissions updated across the platform." });
      setIsRoleDialogOpen(false);
      setEditingRole(null);
      setRoleForm({ name: '', permissions: [], status: 'Active' });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update Firestore Only
        await updateDoc(doc(db, 'users', editingUser.id), {
          name: userForm.name,
          role: userForm.roleId,
          status: userForm.status,
          updatedAt: new Date().toISOString()
        });
        toast({ title: "User Profile Updated" });
      } else {
        // Create in Auth & Firestore (Secondary App Trick)
        const secondaryAppName = 'StaffCreationApp';
        const secondaryApp = getApps().find(app => app.name === secondaryAppName) 
          || initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        const cred = await createUserWithEmailAndPassword(secondaryAuth, userForm.email, userForm.password);
        const newUser = cred.user;
        await updateProfile(newUser, { displayName: userForm.name });

        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          name: userForm.name,
          email: userForm.email.toLowerCase(),
          role: userForm.roleId,
          status: 'active',
          createdAt: new Date().toISOString(),
          totalEarnings: 0
        });

        // Also add to specific roles collection for Rules compatibility
        await setDoc(doc(db, `roles_${userForm.roleId}`, newUser.uid), {
          uid: newUser.uid,
          assignedAt: new Date().toISOString()
        });

        await signOut(secondaryAuth);
        toast({ title: "Staff Account Activated" });
      }
      setIsUserDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    const data = staffUsers?.map(u => ({ Name: u.name, Email: u.email, Role: u.role, Status: u.status })) || [];
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Name,Email,Role,Status", ...data.map(row => Object.values(row).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `staff_directory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const togglePermission = (id: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id) 
        : [...prev.permissions, id]
    }));
  };

  return (
    <div className="space-y-8 pb-20 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Access Control Center</h1>
          <p className="text-muted-foreground text-sm font-medium">Granular role-based security and personnel management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="rounded-xl font-bold h-11 border-gray-200 gap-2">
            <Download size={16} /> Export CSV
          </Button>
          <Button onClick={() => setIsUserDialogOpen(true)} className="rounded-xl font-black h-11 px-6 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
            <UserPlus size={18} /> Enroll Staff
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Admins", val: stats.admin, icon: ShieldCheck, color: "text-red-600", bg: "bg-red-50" },
          { label: "Managers", val: stats.manager, icon: BadgeCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Tech / Staff", val: stats.technician, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Active Roles", val: stats.activeRoles, icon: Zap, color: "text-green-600", bg: "bg-green-50" },
          { label: "Inactive", val: stats.inactiveRoles, icon: XCircle, color: "text-gray-400", bg: "bg-gray-50" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={18} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-fit">
          <TabsTrigger value="roles" className="rounded-lg gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Settings size={16} /> Role Definitions
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users size={16} /> Staff Directory
          </TabsTrigger>
        </TabsList>

        {/* TAB: ROLES */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search roles..." 
                className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => { setEditingRole(null); setRoleForm({ name: '', permissions: [], status: 'Active' }); setIsRoleDialogOpen(true); }} className="h-12 gap-2 rounded-xl font-black uppercase text-[10px]">
              <Plus size={16} /> Create Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : roles?.map((role) => (
              <Card key={role.id} className={cn("border-none shadow-sm rounded-3xl overflow-hidden group transition-all", role.status === 'Inactive' && "opacity-60")}>
                <CardHeader className="bg-gray-50/50 border-b p-6 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black uppercase tracking-tight">{role.name}</CardTitle>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1">{role.permissions?.length || 0} PERMISSIONS</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[8px] font-black border-none px-2", role.status === 'Active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{role.status}</Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.slice(0, 4).map((p: string) => (
                      <Badge key={p} className="bg-primary/5 text-primary text-[8px] font-bold uppercase border-none">{p.split('.')[1]}</Badge>
                    ))}
                    {role.permissions?.length > 4 && <span className="text-[8px] font-black text-muted-foreground">+{role.permissions.length - 4} MORE</span>}
                  </div>
                  <div className="pt-4 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold h-9" onClick={() => { setEditingRole(role); setRoleForm(role); setIsRoleDialogOpen(true); }}>Edit Rules</Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => deleteDoc(doc(db!, 'roles_management', role.id))}><Trash2 size={16} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: USERS */}
        <TabsContent value="users">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow>
                    <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Personnel</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Auth Email</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Global Role</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                    <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uLoading ? <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow> : staffUsers?.map((u) => (
                    <TableRow key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black">{u.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <p className="font-bold text-sm text-gray-900 uppercase leading-none">{u.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground mt-1">ID: {u.id.slice(0, 12)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs text-gray-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary font-black uppercase text-[8px] border-none px-2">{u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={u.status === 'active'} 
                          onCheckedChange={(val) => updateDoc(doc(db!, 'users', u.id), { status: val ? 'active' : 'disabled' })}
                        />
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingUser(u); setUserForm({ ...userForm, name: u.name, email: u.email, roleId: u.role, status: u.status }); setIsUserDialogOpen(true); }}><Settings size={16} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'users', u.id))}><Trash2 size={16} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ROLE MODAL */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden">
          <header className="p-8 bg-[#081621] text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-widest">{editingRole ? 'Update Role Policies' : 'Define New Role'}</DialogTitle>
            <DialogDescription className="text-white/40 mt-1 uppercase font-bold text-[10px]">Configure granular access levels</DialogDescription>
          </header>
          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Role Label</Label>
              <Input 
                value={roleForm.name} 
                onChange={e => setRoleForm({...roleForm, name: e.target.value})}
                placeholder="e.g. Finance Manager"
                className="h-12 bg-gray-50 border-none rounded-xl font-bold"
              />
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2">Permission Matrix</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PERMISSION_LIST.map(p => (
                  <div key={p.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => togglePermission(p.id)}>
                    <Checkbox checked={roleForm.permissions.includes(p.id)} onCheckedChange={() => togglePermission(p.id)} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">{p.label}</p>
                      <p className="text-[8px] font-black text-muted-foreground uppercase">{p.group}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-gray-50 border-t flex gap-2">
            <Button variant="ghost" onClick={() => setIsRoleDialogOpen(false)} className="rounded-xl font-bold">Discard</Button>
            <Button onClick={handleSaveRole} disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 shadow-xl">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Sync Policies"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* USER MODAL */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden">
          <header className="p-8 bg-[#081621] text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-widest">{editingUser ? 'Update Staff Member' : 'Personnel Enrollment'}</DialogTitle>
          </header>
          <form onSubmit={handleCreateAccount} className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Legal Name</Label>
              <Input 
                value={userForm.name} 
                onChange={e => setUserForm({...userForm, name: e.target.value})}
                required className="h-12 bg-gray-50 border-none rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Login Email</Label>
              <Input 
                type="email"
                value={userForm.email} 
                onChange={e => setUserForm({...userForm, email: e.target.value})}
                disabled={!!editingUser}
                required className="h-12 bg-gray-50 border-none rounded-xl"
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Secure Password</Label>
                <Input 
                  type="password"
                  value={userForm.password} 
                  onChange={e => setUserForm({...userForm, password: e.target.value})}
                  required className="h-12 bg-gray-50 border-none rounded-xl"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Designated Role</Label>
              <Select value={userForm.roleId} onValueChange={v => setUserForm({...userForm, roleId: v})}>
                <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {['admin', 'manager', 'accountant', 'order_manager', 'staff'].map(r => (
                    <SelectItem key={r} value={r} className="uppercase font-black text-[10px]">{r.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl mt-4">
              {isSubmitting ? <Loader2 className="animate-spin" /> : (editingUser ? "Sync Profile" : "Activate Account")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function where(arg0: string, arg1: string, arg2: string) {
  return (db: any) => {}; // Placeholder for the actual where function
}
