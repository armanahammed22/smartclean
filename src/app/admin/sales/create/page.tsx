
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy } from 'firebase/firestore';
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, X, Plus, Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function CreateSalesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const db = useFirestore();
    const { toast } = useToast();
    const modeParam = searchParams.get('mode') || 'order';

    const [currentMode, setCurrentMode] = useState<'order' | 'booking'>(modeParam as any);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' });
    const [bookingDetails, setBookingDetails] = useState({ date: '', time: '', duration: '' });
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');

    const productsRef = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
    const servicesRef = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);

    const { data: products } = useCollection(productsRef);
    const { data: services } = useCollection(servicesRef);

    useEffect(() => {
        if (modeParam === 'order' || modeParam === 'booking') {
            setCurrentMode(modeParam as any);
            setSelectedItems([]);
        }
    }, [modeParam]);

    const allItems = useMemo(() => {
        const prodList = products?.map(p => ({ id: p.id, name: p.name, type: 'product', price: p.price, category: p.categoryId })) || [];
        const servList = services?.map(s => ({ id: s.id, name: s.title, type: 'service', price: s.basePrice, category: s.categoryId })) || [];
        return [...prodList, ...servList];
    }, [products, services]);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return allItems.filter(item => 
            (item.type === currentMode) && 
            (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [searchQuery, allItems, currentMode]);

    const calculateTotals = () => {
        const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const charge = currentMode === 'order' ? 80 : 100; // 80 for delivery, 100 for service base
        const total = subtotal + charge - discount;
        return { subtotal, charge, total };
    };

    const { subtotal, charge, total } = calculateTotals();

    const addItem = (item: any) => {
        const existing = selectedItems.find(i => i.id === item.id);
        if (existing) {
            setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
        }
        setSearchQuery('');
        setShowResults(false);
    };

    const removeItem = (id: string) => setSelectedItems(selectedItems.filter(i => i.id !== id));
    
    const updateQuantity = (id: string, delta: number) => {
        setSelectedItems(selectedItems.map(i => {
            if (i.id === id) {
                const q = Math.max(1, i.quantity + delta);
                return { ...i, quantity: q };
            }
            return i;
        }));
    };

    const handleSubmit = async () => {
        if (!db) return;
        if (selectedItems.length === 0) {
            toast({ variant: "destructive", title: "আইটেম নেই", description: "কমপক্ষে একটি আইটেম যোগ করুন।" });
            return;
        }
        if (!customer.name || !customer.phone || !customer.address) {
            toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ", description: "প্রয়োজনীয় সব তথ্য পূরণ করুন।" });
            return;
        }

        setIsLoading(true);
        try {
            const data = {
                customerName: customer.name,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                address: customer.address,
                items: selectedItems.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, itemType: i.type })),
                subtotal,
                discount,
                totalPrice: total,
                paymentMethod,
                notes,
                status: 'New',
                createdAt: new Date().toISOString()
            };

            if (currentMode === 'booking') {
                Object.assign(data, {
                    dateTime: bookingDetails.date + ' ' + bookingDetails.time,
                    duration: bookingDetails.duration,
                    serviceTitle: selectedItems[0]?.name
                });
            }

            const coll = currentMode === 'order' ? 'orders' : 'bookings';
            const docRef = await addDoc(collection(db, coll), data);
            
            await getOrCreateInvoice(db, docRef.id, currentMode === 'order' ? 'order' : 'booking', data);

            toast({ title: "সফল হয়েছে", description: currentMode === 'order' ? "অর্ডার তৈরি হয়েছে!" : "বুকিং তৈরি হয়েছে!" });
            router.push(currentMode === 'order' ? '/admin/orders' : '/admin/bookings');
        } catch (e) {
            toast({ variant: "destructive", title: "এরর", description: "আবার চেষ্টা করুন।" });
        } finally {
            setIsLoading(false);
        }
    };

    const formatNumber = (num: number) => num.toLocaleString('en-IN');

    return (
        <div className="dashboard-container">
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
                
                :root {
                    --primary: #4F46E5;
                    --primary-soft: rgba(79, 70, 229, 0.08);
                    --bg-main: #F8FAFC;
                    --border: #E2E8F0;
                    --text-main: #0F172A;
                    --text-muted: #64748B;
                }

                .dashboard-container { 
                    max-width: 1200px; 
                    margin: 0 auto; 
                    padding: 1.5rem; 
                    font-family: 'Hind Siliguri', 'Inter', sans-serif;
                }

                .header-area {
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .back-btn {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .back-btn:hover { background: var(--bg-main); transform: translateX(-3px); }

                .page-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: var(--text-main);
                    letter-spacing: -0.02em;
                }

                .main-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }

                @media (min-width: 1024px) {
                    .main-grid { grid-template-columns: 1.6fr 1fr; }
                }

                .card {
                    background: white;
                    border-radius: 24px;
                    border: 1px solid var(--border);
                    padding: 1.75rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    margin-bottom: 1.5rem;
                }

                .card-head {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #F1F5F9;
                }

                .card-icon {
                    width: 42px;
                    height: 42px;
                    background: var(--primary-soft);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                }

                .card-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-main);
                }

                .search-box {
                    position: relative;
                    margin-bottom: 1.5rem;
                }

                .search-input {
                    width: 100%;
                    height: 54px;
                    padding: 0 1rem 0 3rem;
                    background: #F8FAFC;
                    border: 2px solid #F1F5F9;
                    border-radius: 16px;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .search-input:focus {
                    background: white;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px var(--primary-soft);
                    outline: none;
                }

                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    margin-top: 0.5rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    max-height: 300px;
                    overflow-y: auto;
                    z-index: 50;
                }

                .search-item {
                    padding: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    border-bottom: 1px solid #F1F5F9;
                }

                .search-item:hover { background: #F8FAFC; }

                .empty-cart {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: var(--text-muted);
                }

                .empty-icon { font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.4; }

                .item-row {
                    background: #F8FAFC;
                    border-radius: 16px;
                    padding: 1.25rem;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .q-btn {
                    width: 32px;
                    height: 32px;
                    border: 1px solid var(--border);
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.25rem;
                }

                @media (min-width: 640px) {
                    .form-grid { grid-template-columns: 1fr 1fr; }
                }

                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--text-main);
                }

                input, textarea, select {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    font-size: 0.95rem;
                }

                .summary-line {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem 0;
                    border-bottom: 1px dashed #E2E8F0;
                }

                .summary-total {
                    padding-top: 1.25rem;
                    margin-top: 0.5rem;
                    border-top: 2px solid #F1F5F9;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--primary);
                }

                .payment-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                }

                .pay-opt {
                    cursor: pointer;
                    position: relative;
                }

                .pay-opt input { display: none; }

                .pay-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1rem;
                    border: 2px solid #F1F5F9;
                    border-radius: 16px;
                    background: #F8FAFC;
                    transition: all 0.2s;
                }

                .pay-opt input:checked + .pay-label {
                    border-color: var(--primary);
                    background: white;
                    box-shadow: 0 4px 12px var(--primary-soft);
                }

                .main-btn {
                    width: 100%;
                    height: 56px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    cursor: pointer;
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .main-btn:hover { transform: translateY(-2px); opacity: 0.95; }

                .draft-btn {
                    width: 100%;
                    height: 48px;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    font-weight: 600;
                    margin-bottom: 0.75rem;
                    cursor: pointer;
                }
            `}} />

            <div className="header-area">
                <button className="back-btn" onClick={() => router.back()}>←</button>
                <h1 className="page-title">{currentMode === 'order' ? 'নতুন অর্ডার' : 'নতুন বুকিং'}</h1>
            </div>

            <div className="main-grid">
                <div className="left-side">
                    {/* Item Selection Card */}
                    <div className="card">
                        <div className="card-head">
                            <div className="card-icon">📦</div>
                            <h2 className="card-title">{currentMode === 'order' ? 'পণ্য যোগ করুন' : 'সেবা যোগ করুন'}</h2>
                        </div>

                        <div className="search-box">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input 
                                type="text" 
                                className="search-input" 
                                placeholder="নাম বা আইডি দিয়ে খুঁজুন..." 
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
                            />
                            {showResults && searchQuery && (
                                <div className="search-results">
                                    {filteredItems.map(item => (
                                        <div key={item.id} className="search-item" onClick={() => addItem(item)}>
                                            <div>
                                                <div className="font-bold text-sm">{item.name}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest">{item.category}</div>
                                            </div>
                                            <div className="font-black text-primary">৳{item.price}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="selected-list">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-sm">নির্বাচিত আইটেম</span>
                                <Badge className="bg-primary/10 text-primary border-none">{selectedItems.length}</Badge>
                            </div>

                            {selectedItems.length === 0 ? (
                                <div className="empty-cart">
                                    <div className="empty-icon">📦</div>
                                    <p className="font-medium text-sm">এখনও কোনো আইটেম যোগ করা হয়নি</p>
                                </div>
                            ) : (
                                selectedItems.map(item => (
                                    <div key={item.id} className="item-row">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">{item.name}</div>
                                            <div className="text-[10px] text-slate-400">৳{item.price}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <button className="q-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                                <span className="font-bold text-sm">{item.quantity}</span>
                                                <button className="q-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <div className="text-[10px] text-slate-400 uppercase">মোট</div>
                                                <div className="font-black text-primary">৳{formatNumber(item.price * item.quantity)}</div>
                                            </div>
                                            <button className="text-red-400 hover:text-red-600" onClick={() => removeItem(item.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Customer Info Card */}
                    <div className="card">
                        <div className="card-head">
                            <div className="card-icon">👤</div>
                            <h2 className="card-title">গ্রাহকের তথ্য</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label>গ্রাহকের নাম *</label>
                                <input type="text" placeholder="যেমন: রহিম উদ্দিন" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                            </div>
                            <div className="form-grid">
                                <div>
                                    <label>মোবাইল নম্বর *</label>
                                    <input type="tel" placeholder="01XXXXXXXXX" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                                </div>
                                <div>
                                    <label>ইমেইল (ঐচ্ছিক)</label>
                                    <input type="email" placeholder="example@email.com" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label>ঠিকানা *</label>
                                <textarea placeholder="বাড়ি নং, রোড, এলাকা, শহর" rows={3} value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
                            </div>

                            {currentMode === 'booking' && (
                                <div className="pt-4 border-t space-y-4 animate-in fade-in">
                                    <div className="form-grid">
                                        <div>
                                            <label>বুকিং তারিখ *</label>
                                            <input type="date" value={bookingDetails.date} onChange={e => setBookingDetails({...bookingDetails, date: e.target.value})} />
                                        </div>
                                        <div>
                                            <label>সময় *</label>
                                            <input type="time" value={bookingDetails.time} onChange={e => setBookingDetails({...bookingDetails, time: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="right-side lg:sticky lg:top-24 h-fit">
                    {/* Summary Card */}
                    <div className="card">
                        <div className="card-head">
                            <div className="card-icon">💰</div>
                            <h2 className="card-title">সারসংক্ষেপ</h2>
                        </div>
                        <div className="space-y-1">
                            <div className="summary-line">
                                <span className="text-slate-500 font-medium">সাবটোটাল</span>
                                <span className="font-bold">৳ {formatNumber(subtotal)}</span>
                            </div>
                            <div className="summary-line">
                                <span className="text-slate-500 font-medium">{currentMode === 'order' ? 'ডেলিভারি চার্জ' : 'সার্ভিস চার্জ'}</span>
                                <span className="font-bold">৳ {charge}</span>
                            </div>
                            <div className="summary-line items-center">
                                <span className="text-slate-500 font-medium">ছাড়</span>
                                <input 
                                    type="number" 
                                    value={discount} 
                                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-24 h-8 bg-slate-50 border-none text-right font-bold" 
                                />
                            </div>
                            <div className="summary-total flex justify-between items-center">
                                <span>মোট পরিমাণ</span>
                                <span>৳ {formatNumber(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Card */}
                    <div className="card">
                        <div className="card-head">
                            <div className="card-icon">💳</div>
                            <h2 className="card-title">পেমেন্ট পদ্ধতি</h2>
                        </div>
                        <div className="payment-grid">
                            {[
                                { id: 'cod', label: 'ক্যাশ অন ডেলিভারি', icon: '📦' },
                                { id: 'bkash', label: 'বিকাশ', icon: '💸' },
                                { id: 'nagad', label: 'নগদ', icon: '💰' },
                                { id: 'bank', label: 'ব্যাংক ট্রান্সফার', icon: '🏦' }
                            ].map(method => (
                                <label key={method.id} className="pay-opt">
                                    <input 
                                        type="radio" 
                                        name="pay" 
                                        checked={paymentMethod === method.id} 
                                        onChange={() => setPaymentMethod(method.id)} 
                                    />
                                    <div className="pay-label">
                                        <span className="text-xl mb-1">{method.icon}</span>
                                        <span className="pay-name">{method.label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="card">
                        <div className="card-head">
                            <div className="card-icon">📝</div>
                            <h2 className="card-title">অতিরিক্ত নোট</h2>
                        </div>
                        <textarea 
                            placeholder="কোনো বিশেষ নির্দেশনা বা মন্তব্য" 
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="actions">
                        <button className="draft-btn">💾 খসড়া সংরক্ষণ</button>
                        <button 
                            className={cn("main-btn", isLoading && "opacity-70 pointer-events-none")} 
                            onClick={handleSubmit}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <>✅ {currentMode === 'order' ? 'অর্ডার' : 'বুকিং'} নিশ্চিত করুন</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SalesCreatePage() {
    return (
        <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>}>
            <CreateSalesContent />
        </Suspense>
    );
}
