
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy } from 'firebase/firestore';
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
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
        const serviceCharge = currentMode === 'order' ? 80 : 80; // Keeping 80 as per user HTML
        const total = subtotal + serviceCharge - discount;
        return { subtotal, serviceCharge, total };
    };

    const { subtotal, serviceCharge, total } = calculateTotals();

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
        if (selectedItems.length === 0) return alert('⚠️ অনুগ্রহ করে কমপক্ষে একটি আইটেম যোগ করুন!');
        if (!customer.name || !customer.phone || !customer.address) return alert('⚠️ অনুগ্রহ করে সমস্ত প্রয়োজনীয় তথ্য পূরণ করুন!');

        if (currentMode === 'booking' && (!bookingDetails.date || !bookingDetails.time)) {
            return alert('⚠️ অনুগ্রহ করে বুকিং তারিখ এবং সময় নির্বাচন করুন!');
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
            
            // Auto-generate Invoice
            await getOrCreateInvoice(db, docRef.id, currentMode === 'order' ? 'order' : 'booking', data);

            toast({ title: "Success", description: currentMode === 'order' ? "অর্ডার সফলভাবে তৈরি হয়েছে!" : "বুকিং সফলভাবে তৈরি হয়েছে!" });
            router.push(currentMode === 'order' ? '/admin/orders' : '/admin/bookings');
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "সিস্টেম এরর। আবার চেষ্টা করুন।" });
        } finally {
            setIsLoading(false);
        }
    };

    const convertToBengaliNumber = (num: number) => {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return num.toString().split('').map(digit => bengaliDigits[parseInt(digit)] || digit).join('');
    };

    const formatNumber = (num: number) => num.toLocaleString('en-IN');

    return (
        <div className="dashboard-container">
            <style dangerouslySetInnerHTML={{ __html: `
                :root {
                    --primary: #4F46E5;
                    --primary-light: #6366F1;
                    --primary-dark: #4338CA;
                    --secondary: #EC4899;
                    --success: #10B981;
                    --warning: #F59E0B;
                    --danger: #EF4444;
                    --bg-main: #F8FAFC;
                    --bg-card: #FFFFFF;
                    --bg-elevated: #FEFEFE;
                    --text-primary: #0F172A;
                    --text-secondary: #475569;
                    --text-muted: #94A3B8;
                    --border: #E2E8F0;
                    --border-light: #F1F5F9;
                    --order-accent: #3B82F6;
                    --booking-accent: #8B5CF6;
                    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
                    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
                    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }

                .dashboard-container { max-width: 1400px; margin: 0 auto; padding: 2rem 1rem; position: relative; z-index: 1; }
                .dashboard-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid var(--border-light); }
                .header-left { display: flex; align-items: center; gap: 1rem; }
                .back-button { width: 44px; height: 44px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; font-size: 1.25rem; }
                .back-button:hover { background: var(--primary); color: white; transform: translateX(-4px); box-shadow: var(--shadow-md); }
                .dashboard-header h1 { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: 0; }
                .header-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); color: white; border-radius: 50px; font-size: 0.875rem; font-weight: 600; box-shadow: var(--shadow-md); }
                .tab-container { background: var(--bg-card); border-radius: 16px; padding: 0.5rem; display: inline-flex; gap: 0.5rem; margin-bottom: 2rem; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
                .tab-button { padding: 0.875rem 2rem; border: none; background: transparent; color: var(--text-secondary); font-weight: 600; font-size: 1rem; border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 0.5rem; position: relative; overflow: hidden; }
                .tab-button.active { color: white; box-shadow: var(--shadow-md); }
                .tab-button::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); opacity: 0; transition: opacity 0.3s ease; z-index: -1; }
                .tab-button.active::before { opacity: 1; }
                .tab-button.active.booking-tab::before { background: linear-gradient(135deg, var(--booking-accent) 0%, #A78BFA 100%); }
                .main-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
                @media (min-width: 1024px) { .main-grid { grid-template-columns: 1.5fr 1fr; } }
                .card { background: var(--bg-card); border-radius: 20px; padding: 2rem; box-shadow: var(--shadow-md); border: 1px solid var(--border); transition: all 0.3s ease; margin-bottom: 2rem; }
                .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-light); }
                .card-icon { width: 48px; height: 48px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; }
                .card-title { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin: 0; }
                .search-container { position: relative; margin-bottom: 1.5rem; }
                .search-input-wrapper { position: relative; }
                .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.25rem; }
                .search-input { width: 100%; padding: 1rem 1rem 1rem 3rem; border: 2px solid var(--border); border-radius: 14px; font-size: 1rem; background: var(--bg-main); }
                .search-results { position: absolute; top: calc(100% + 0.5rem); left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow-xl); max-height: 300px; overflow-y: auto; z-index: 10; display: none; }
                .search-results.active { display: block; }
                .search-result-item { padding: 1rem; border-bottom: 1px solid var(--border-light); cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
                .search-result-item:hover { background: var(--bg-main); }
                .result-tag { display: inline-block; padding: 0.25rem 0.75rem; background: var(--order-accent); color: white; border-radius: 6px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem; }
                .result-tag.service { background: var(--booking-accent); }
                .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .items-count { background: var(--primary); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600; }
                .item-card { background: var(--bg-main); border: 2px solid var(--border); border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem; position: relative; }
                .item-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; }
                .remove-item { color: var(--danger); cursor: pointer; font-size: 1.5rem; background: none; border: none; }
                .item-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .quantity-control { display: flex; align-items: center; gap: 0.5rem; }
                .quantity-btn { width: 36px; height: 36px; border: 2px solid var(--border); background: var(--bg-card); border-radius: 8px; cursor: pointer; font-weight: 600; }
                .item-total { text-align: right; }
                .item-total-value { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
                .form-group { margin-bottom: 1.5rem; }
                .form-row { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
                @media (min-width: 640px) { .form-row { grid-template-columns: 1fr 1fr; } }
                label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
                input, select, textarea { width: 100%; padding: 0.875rem 1rem; border: 2px solid var(--border); border-radius: 12px; font-size: 1rem; background: var(--bg-main); }
                .booking-fields { display: none; }
                .booking-fields.active { display: block; }
                .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 0; border-bottom: 1px solid var(--border-light); }
                .summary-row:last-child { border-bottom: none; margin-top: 0.75rem; padding-top: 1.25rem; border-top: 2px solid var(--border); }
                .summary-row:last-child .summary-value { font-size: 1.5rem; color: var(--primary); font-weight: 700; }
                .payment-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 1rem; }
                .payment-option label { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; border: 2px solid var(--border); border-radius: 12px; cursor: pointer; background: var(--bg-main); min-height: 90px; }
                .payment-option input[type="radio"]:checked + label { border-color: var(--primary); background: rgba(79, 70, 229, 0.05); }
                .payment-icon { font-size: 1.75rem; margin-bottom: 0.5rem; }
                .btn { padding: 1.125rem 2rem; border-radius: 14px; font-weight: 600; font-size: 1rem; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; }
                .btn-secondary { background: var(--bg-card); color: var(--text-primary); border: 2px solid var(--border); }
                .btn-primary { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); color: white; }
                .btn-primary.booking-mode { background: linear-gradient(135deg, var(--booking-accent) 0%, #A78BFA 100%); }
                .empty-state { text-align: center; padding: 3rem 2rem; color: var(--text-muted); }
                .empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
                .loading::after { content: ''; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; margin-left: 10px; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}} />
            
            <div className="dashboard-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => router.back()}>←</button>
                    <h1>ম্যানুয়াল অর্ডার/বুকিং তৈরি করুন</h1>
                </div>
                <div className="header-badge">⚡ Admin Panel</div>
            </div>

            <div className="tab-container">
                <button className={cn("tab-button", currentMode === 'order' && "active")} onClick={() => router.push('/admin/sales/create?mode=order')}>
                    <span className="tab-icon">🛒</span>
                    <span>অর্ডার</span>
                </button>
                <button className={cn("tab-button booking-tab", currentMode === 'booking' && "active")} onClick={() => router.push('/admin/sales/create?mode=booking')}>
                    <span className="tab-icon">📅</span>
                    <span>বুকিং</span>
                </button>
            </div>

            <div className="main-grid">
                <div className="left-column">
                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">{currentMode === 'order' ? '🛍️' : '📅'}</div>
                            <h2 className="card-title">{currentMode === 'order' ? 'পণ্য যোগ করুন' : 'সেবা যোগ করুন'}</h2>
                        </div>

                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <span className="search-icon">🔍</span>
                                <input 
                                    type="text" 
                                    className="search-input" 
                                    placeholder={`${currentMode === 'order' ? 'পণ্য' : 'সেবা'} খুঁজুন...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowResults(true)}
                                />
                            </div>
                            <div className={cn("search-results", showResults && searchQuery && "active")}>
                                {filteredItems.map(item => (
                                    <div key={item.id} className="search-result-item" onClick={() => addItem(item)}>
                                        <div className="result-info">
                                            <div className="result-name">
                                                {item.name}
                                                <span className={cn("result-tag", item.type)}>{item.type === 'product' ? 'পণ্য' : 'সেবা'}</span>
                                            </div>
                                            <div className="result-meta">{item.category}</div>
                                        </div>
                                        <div className="result-price">৳ {item.price.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="selected-items">
                            <div className="items-header">
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>নির্বাচিত আইটেম</h3>
                                <span className="items-count">{convertToBengaliNumber(selectedItems.length)}</span>
                            </div>

                            <div id="selectedItemsList">
                                {selectedItems.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📦</div>
                                        <div className="empty-text">এখনও কোনো আইটেম যোগ করা হয়নি</div>
                                    </div>
                                ) : (
                                    selectedItems.map(item => (
                                        <div key={item.id} className="item-card">
                                            <div className="item-header">
                                                <div className="item-name">{item.name}</div>
                                                <button className="remove-item" onClick={() => removeItem(item.id)}>×</button>
                                            </div>
                                            <div className="item-controls">
                                                <div className="quantity-control">
                                                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                                    <span className="quantity-value">{convertToBengaliNumber(item.quantity)}</span>
                                                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                                </div>
                                                <div className="item-total">
                                                    <div className="item-total-label">মোট</div>
                                                    <div className="item-total-value">৳ {(item.price * item.quantity).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">👤</div>
                            <h2 className="card-title">গ্রাহকের তথ্য</h2>
                        </div>
                        <div className="form-group">
                            <label>গ্রাহকের নাম *</label>
                            <input type="text" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="যেমন: রহিম উদ্দিন" required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>মোবাইল নম্বর *</label>
                                <input type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} placeholder="01XXXXXXXXX" required />
                            </div>
                            <div className="form-group">
                                <label>ইমেইল <span className="label-optional">(ঐচ্ছিক)</span></label>
                                <input type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} placeholder="example@email.com" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>ঠিকানা *</label>
                            <textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="বাড়ি নং, রোড, এলাকা, শহর" required></textarea>
                        </div>

                        <div className={cn("booking-fields", currentMode === 'booking' && "active")}>
                            <div className="form-row datetime-row">
                                <div className="form-group">
                                    <label>বুকিং তারিখ *</label>
                                    <input type="date" value={bookingDetails.date} onChange={e => setBookingDetails({...bookingDetails, date: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>সময় *</label>
                                    <input type="time" value={bookingDetails.time} onChange={e => setBookingDetails({...bookingDetails, time: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>সেবার সময়কাল</label>
                                <select value={bookingDetails.duration} onChange={e => setBookingDetails({...bookingDetails, duration: e.target.value})}>
                                    <option value="">নির্বাচন করুন</option>
                                    <option value="30">৩০ মিনিট</option>
                                    <option value="60">১ ঘন্টা</option>
                                    <option value="120">২ ঘন্টা</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="right-column">
                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">💰</div>
                            <h2 className="card-title">সারসংক্ষেপ</h2>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">সাবটোটাল</span>
                            <span className="summary-value">৳ {formatNumber(subtotal)}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">{currentMode === 'order' ? 'ডেলিভারি চার্জ' : 'সার্ভিস চার্জ'}</span>
                            <span className="summary-value">৳ {serviceCharge}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">ছাড়</span>
                            <div style={{ maxWidth: '150px' }}>
                                <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ padding: '0.5rem', textAlign: 'right' }} />
                            </div>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">মোট পরিমাণ</span>
                            <span className="summary-value">৳ {formatNumber(total)}</span>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
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
                                <div key={method.id} className="payment-option">
                                    <input type="radio" id={method.id} name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} />
                                    <label htmlFor={method.id}>
                                        <div className="payment-icon">{method.icon}</div>
                                        <div className="payment-name">{method.label}</div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">📝</div>
                            <h2 className="card-title">অতিরিক্ত নোট</h2>
                        </div>
                        <div className="form-group">
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="কোনো বিশেষ নির্দেশনা বা মন্তব্য"></textarea>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="btn btn-secondary">💾 খসড়া সংরক্ষণ</button>
                        <button className={cn("btn btn-primary", currentMode === 'booking' && "booking-mode", isLoading && "loading")} onClick={handleSubmit}>
                            {currentMode === 'order' ? '✅ অর্ডার নিশ্চিত করুন' : '✅ বুকিং নিশ্চিত করুন'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SalesCreatePage() {
    return (
        <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>}>
            <CreateSalesContent />
        </Suspense>
    );
}
