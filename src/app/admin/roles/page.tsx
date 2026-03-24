
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Loader2, 
  ShieldAlert, 
  ArrowLeft,
  Mail,
  Lock,
  User,
  Key,
  BadgeCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const ROLES = [
  { id: 'admins', label: 'Admin', color: 'bg-red-100 text-red-700', value: 'admin', desc: 'Full system access' },
  { id: 'managers', label: 'Manager', color: 'bg-blue-100 text-blue-700', value: 'manager', desc: 'Ops management' },
  { id: 'accounts', label: 'Accounts', color: 'bg-green-100 text-green-700', value: 'accountant', desc: 'Financial reports' },
  { id: 'order_managers', label: 'Order Manager', color: 'bg-purple-100 text-purple-700', value: 'order_manager', desc: 'Dispatch control' },
  { id: 'employees', label: 'Technician', color: 'bg-orange-100 text-orange-700', value: 'staff', desc: 'Field worker' }
];

export default function RoleManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [targetUid, setTargetUid] = useState('');
  const [selectedRoleId, setSelectedRole] = useState('employees');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // New User Form State
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: 'employees'
  });

  const adminsQuery = useMemoFirebase(() => db ? collection(db, 'roles_admins') : null, [db]);
  const managersQuery = useMemoFirebase(() => db ? collection(db, 'roles_managers') : null, [db]);
  const accountsQuery = useMemoFirebase(() => db ? collection(db, 'roles_accounts') : null, [db]);
  const orderManagersQuery = useMemoFirebase(() => db ? collection(db, 'roles_order_managers') : null, [db]);
  const employeesQuery = useMemoFirebase(() => db ? collection(db, 'roles_employees') : null, [db]);

  const { data: admins, isLoading: aLoading } = useCollection(adminsQuery);
  const { data: managers, isLoading: mLoading } = useCollection(managersQuery);
  const { data: accounts, isLoading: acLoading } = useCollection(accountsQuery);
  const { data: orderManagers, isLoading: omLoading } = useCollection(orderManagersQuery);
  const { data: employees, isLoading: eLoading } = useCollection(employeesQuery);

  /**
   * CREATE NEW STAFF/ADMIN ACCOUNT
   * Uses a secondary Firebase app to prevent logging out the current admin.
   */
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    let secondaryApp;
    try {
      // 1. Initialize secondary app
      const secondaryAppName = 'SecondaryAuthApp';
      secondaryApp = getApps().find(app => app.name === secondaryAppName) 
        || initializeApp(firebaseConfig, secondaryAppName);
      
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create Auth User
      const userCred = await createUserWithEmailAndPassword(
        secondaryAuth, 
        newUserData.email.trim().toLowerCase(), 
        newUserData.password
      );
      
      const newUser = userCred.user;
      await updateProfile(newUser, { displayName: newUserData.name });

      // 3. Create Security & Profile Documents
      const roleConfig = ROLES.find(r => r.id === newUserData.roleId);
      const colName = `roles_${newUserData.roleId}`;

      // Permission Document
      await setDoc(doc(db, colName, newUser.uid), {
        uid: newUser.uid,
        email: newUserData.email.toLowerCase(),
        assignedAt: new Date().toISOString(),
        role: newUserData.roleId
      });

      // Public Profile
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        name: newUserData.name,
        email: newUserData.email.toLowerCase(),
        role: roleConfig?.value || 'staff',
        status: 'active',
        createdAt: new Date().toISOString(),
        totalEarnings: 0
      });

      // 4. Cleanup: Sign out from secondary app
      await signOut(secondaryAuth);

      toast({ 
        title: "Account Created", 
        description: `${newUserData.name} has been granted ${roleConfig?.label} access.` 
      });
      
      setIsCreateDialogOpen(false);
      setNewUserData({ name: '', email: '', password: '', roleId: 'employees' });
    } catch (error: any) {
      console.error("Staff creation failed:", error);
      toast({ 
        variant: "destructive", 
        title: "Creation Failed", 
        description: error.message 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !targetUid.trim()) return;
    setIsSubmitting(true);

    try {
      const colName = `roles_${selectedRoleId}`;
      const roleConfig = ROLES.find(r => r.id === selectedRoleId);
      
      await setDoc(doc(db, colName, targetUid.trim()), {
        uid: targetUid.trim(),
        assignedAt: new Date().toISOString(),
        role: selectedRoleId
      });

      await updateDoc(doc(db, 'users', targetUid.trim()), {
        role: roleConfig?.value || 'customer',
        updatedAt: new Date().toISOString()
      }).catch(() => {
        console.warn("User profile not found in 'users' collection, only security role created.");
      });

      toast({ title: "Role Assigned", description: `UID granted ${roleConfig?.label} privileges.` });
      setTargetUid('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Assignment Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeRole = async (colId: string, uid: string) => {
    if (!db || !confirm("Revoke this user's privileges?")) return;
    try {
      await deleteDoc(doc(db, colId, uid));
      await updateDoc(doc(db, 'users', uid), {
        role: 'customer',
        updatedAt: new Date().toISOString()
      }).catch(() => {});
      toast({ title: "Role Revoked" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Revoke Failed", description: e.message });
    }
  };

  const allAssignments = [
    ...(admins?.map(a => ({ ...a, colId: 'roles_admins' })) || []),
    ...(managers?.map(a => ({ ...a, colId: 'roles_managers' })) || []),
    ...(accounts?.map(a => ({ ...a, colId: 'roles_accounts' })) || []),
    ...(orderManagers?.map(a => ({ ...a, colId: 'roles_order_managers' })) || []),
    ...(employees?.map(a => ({ ...a, colId: 'roles_employees' })) || [])
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Privilege Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Control dashboard access and administrative roles</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
              <UserPlus size={18} /> Create Staff Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
            <form onSubmit={handleCreateAccount}>
              <DialogHeader className="p-8 bg-[#081621] text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                  <BadgeCheck className="text-primary" /> Enrollment Form
                </DialogTitle>
                <DialogDescription className="text-white/40 font-medium">
                  Add new dashboard user with direct credentials.
                </DialogDescription>
              </DialogHeader>
              <div className="p-8 space-y-5 bg-white">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Staff Member Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={newUserData.name} 
                      onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                      placeholder="e.g. Abdullah Al Mamun" 
                      className="h-12 pl-11 bg-gray-50 border-none rounded-xl font-bold" 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Auth Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email"
                      value={newUserData.email} 
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                      placeholder="work@smartclean.com" 
                      className="h-12 pl-11 bg-gray-50 border-none rounded-xl font-medium" 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password"
                      value={newUserData.password} 
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                      placeholder="••••••••" 
                      className="h-12 pl-11 bg-gray-50 border-none rounded-xl" 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select Access Level</Label>
                  <Select value={newUserData.roleId} onValueChange={(val) => setNewUserData({...newUserData, roleId: val})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {ROLES.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-bold uppercase text-[10px]">{role.label}</span>
                            <span className="text-[8px] text-muted-foreground leading-none">{role.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="p-8 bg-gray-50 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-8 shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MANUAL ASSIGNMENT */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm h-fit bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 border-b p-8">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Key className="text-primary" size={20} /> Assign Role by UID
              </CardTitle>
              <CardDescription className="text-xs">Promote an existing customer by their ID.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleAssignRole} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User UID</Label>
                  <Input 
                    value={targetUid} 
                    onChange={(e) => setTargetUid(e.target.value)} 
                    placeholder="UID from customer directory" 
                    className="h-12 bg-gray-50 border-none rounded-xl font-mono text-[10px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Type</Label>
                  <Select value={selectedRoleId} onValueChange={setSelectedRole}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {ROLES.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black shadow-lg rounded-xl uppercase tracking-tighter bg-[#081621] hover:bg-[#0a253a]">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Grant Access"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
            <ShieldAlert className="text-amber-600 shrink-0 mt-1" size={24} />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-amber-900">Security Note</h4>
              <p className="text-[10px] font-medium text-amber-800/70 leading-relaxed">
                Roles are verified via Firestore Security Rules. Ensure only trusted individuals are granted Admin or Manager privileges.
              </p>
            </div>
          </div>
        </div>

        {/* ACCESS LIST */}
        <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold uppercase tracking-tight">Active Privileges</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Global access registry</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black">{allAssignments.length} Users</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="font-bold py-5 pl-8 uppercase text-[9px] tracking-widest">User Identity</TableHead>
                  <TableHead className="font-bold uppercase text-[9px] tracking-widest">Access Level</TableHead>
                  <TableHead className="font-bold uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[9px] tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAssignments() ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-24"><Loader2 className="animate-spin text-primary inline" size={32} /></TableCell></TableRow>
                ) : allAssignments.map((assign, i) => {
                  const roleConfig = ROLES.find(r => r.id === assign.colId);
                  return (
                    <TableRow key={i} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[9px] text-gray-400 uppercase tracking-tighter truncate max-w-[150px]">{assign.uid}</span>
                          <span className="font-bold text-xs text-gray-700">{assign.email || 'Existing User'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", roleConfig?.id === 'roles_admins' ? 'bg-red-500' : 'bg-blue-500')} />
                          <Badge className={cn("text-[8px] font-black uppercase border-none px-2 py-0.5", roleConfig?.color)}>
                            {roleConfig?.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600 font-black text-[9px]">
                          <CheckCircle2 size={12} /> VERIFIED
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50" onClick={() => removeRole(assign.colId, assign.uid)}>
                          <XCircle size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {allAssignments.length === 0 && !isLoadingAssignments() && (
                  <TableRow><TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic font-medium">No special privileges assigned.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  function isLoadingAssignments() {
    return aLoading || mLoading || acLoading || omLoading || eLoading;
  }
}
